# AITS Mobile Offline Synchronization Architecture

This document describes the offline-first synchronization architecture between the **React Native / Expo Mobile App** (`aits-mobile`) and the **NestJS Backend API** (`aits-backend`).

---

## 1. Offline Data Flow Topology

```
+---------------------------------------------------------------------------------+
|                              React Native / Expo                                |
|                                                                                 |
|   +-----------------------+                    +----------------------------+   |
|   |   Local SQLite DB     | -- Offline Read -->|   Mobile App UI Screens    |   |
|   +-----------------------+                    +----------------------------+   |
|               |                                              |                  |
|        Queue Operations                              Perform Offline Actions    |
|               v                                              v                  |
|   +-----------------------+                    +----------------------------+   |
|   |  Pending Sync Queue   |                    | Generate Client UUIDs &    |   |
|   |  (Local SQLite Table) |                    | Client Version Timestamps  |   |
|   +-----------------------+                    +----------------------------+   |
+---------------------------------------------------------------------------------+
                                        |
                                        | Network Reconnect Trigger
                                        | POST /sync (SyncBatch Payload)
                                        v
+---------------------------------------------------------------------------------+
|                             NestJS Synchronization API                          |
|                                                                                 |
|   1. Idempotency Check   : Inspect SyncBatch.idempotencyKey                     |
|   2. Batch Processing    : Process SyncRecords in Transaction                   |
|   3. Conflict Resolution : Compare clientVersion vs serverVersion               |
|   4. Reconciliation      : Apply changes or mark status as CONFLICTED           |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                         Central PostgreSQL Database                             |
|                    (SyncBatch & SyncRecord Audit Tables)                        |
+---------------------------------------------------------------------------------+
```

---

## 2. Idempotency & Duplicate Request Protection

- **`idempotencyKey`**: Each mobile sync request generates a unique UUID `idempotencyKey` attached to `SyncBatch`.
- **Network Retry Protection**: If a mobile device sends a sync batch and experiences a network timeout before receiving the HTTP 200 response, it retries with the SAME `idempotencyKey`.
- **Server Verification**: NestJS checks `SyncBatch.idempotencyKey` against PostgreSQL. If the batch has already been processed or is currently `PROCESSING`, the backend returns the existing result without re-executing data insertions.

---

## 3. Conflict Detection & Optimistic Versioning

- **Version Tracking**: `SyncRecord` stores `clientVersion` (sent by mobile SQLite) and `serverVersion` (read from PostgreSQL target record).
- **Update Reconciliation**:
  - If `clientVersion >= serverVersion`, the update is applied, and `serverVersion` incremented.
  - If `clientVersion < serverVersion` (indicating the server record was updated by another user/device while the mobile app was offline):
    - `SyncRecord.status` is set to `CONFLICTED`.
    - `errorMessage` is populated with conflict details (e.g. `"Stale client update. Client version: 2, Server version: 4"`).
    - The server database record is NOT overwritten.
    - The conflict payload is flagged for manual user resolution or administrative review.
