# Milk Production Tracking & Analytics Module — User & Feature Guide

## 1. Overview & Purpose

The **Milk Production Tracking Module** is an enterprise-grade component of the **Animal Identification & Traceability System (AITS)**. It is designed for commercial dairy farms, cooperatives, smallholders, and regulatory authorities to capture, monitor, analyze, and audit daily milk yields across registered dairy cattle.

Accurate milk production tracking enables:
- **Individual Cow Performance Monitoring**: Identifying high-yield lactating cows and detecting early yield drops indicative of subclinical mastitis or metabolic stress.
- **Traceability & Biosecurity**: Ensuring milk from animals undergoing antibiotic withdrawal periods or quarantine is strictly flagged or withheld from the commercial food chain.
- **Farm-Level Economics**: Comparing morning and evening collection volumes, fat/protein percentages, and benchmarking across multiple farm facilities.

---

## 2. Core System Features

### 2.1 Real-Time KPI Summary Cards
Located at the top of the Production page, four dynamic summary cards deliver instant operational visibility:
1. **Today's Total Volume**: Aggregate liters collected today across all accessible farms, with day-over-day percentage trend indicator.
2. **Session Breakdown**: Independent morning and evening collection volume totals.
3. **Active Animals Milked**: Count of distinct cattle milked today versus total registered dairy herd.
4. **Herd Average**: Average volume yield per animal (Liters / Animal) for the current production date.

### 2.2 Interactive Visual Analytics
Visualized through responsive charting powered by Recharts with dark/light mode optimization:
- **7-Day Daily Volume Trends**: Stacked bar/area representation of morning and evening session volumes over the past week.
- **Milking Session Distribution**: Donut chart comparing morning vs. evening collection ratios.
- **Top 5 Lactating Cows**: Leaderboard highlighting the farm's highest-yielding dairy cattle and their average liters per session.
- **Multi-Farm Share**: Proportional contribution of each farm facility to the total collection volume.

### 2.3 Comprehensive Data Table
- **Server-Side Pagination & Sorting**: High-performance paging with column sorting on Date, Animal Tag, Farm Name, Quantity (L), and Quality Status.
- **Fast Search & Filter Bar**:
  - Live text search across Animal Tag (e.g. `TAG-0019`), Cow Name, Farm Name, and Recording Officer.
  - Multi-select filters for Farm facility, Milking Session (`MORNING`, `AFTERNOON`, `EVENING`), and Milk Quality Status (`ACCEPTED`, `PENDING`, `REJECTED`).
  - Custom Date Range pickers (`startDate` to `endDate`).
- **Responsive Views**: Full tabular view for desktop monitors and compact card layout for mobile and tablet field inspections.

### 2.4 Smart Milking Entry Modal
Clicking **"Log Milk Yield"** opens the smart form modal equipped with:
- **Auto Session Detection**: Pre-selects `MORNING` (04:00 - 11:59), `AFTERNOON` (12:00 - 15:59), or `EVENING` (16:00 - 03:59) based on current clock time.
- **Searchable Farm & Cow Selectors**: Searchable dropdowns that display the cow's tag, name, and breed.
- **Duplicate Prevention**: Backend unique constraint enforcement (`animalId + productionDate + milkingSession`) prevents accidental double-logging.
- **Quality & Component Metrics**: Optional fields for Fat %, Protein %, Quality grading, and veterinary collection notes.

### 2.5 Detailed Inspection Modal
Clicking the view icon on any row opens a comprehensive detail view displaying:
- Animal identification number, name, and breed.
- Farm name and location.
- Production date and milking session.
- Volume yield and quality status.
- Fat and protein test results.
- Recorded-by user identity and UTC audit timestamps.

### 2.6 Inline Editing & Safe Deletion
- **Edit Record**: Authorized managers can correct volume readings, update quality classifications, or adjust lab test percentages.
- **Delete Confirmation**: Red dialog with confirmation safeguards preventing accidental data loss while updating historical summaries.

### 2.7 CSV Data Export
- Clicking **"Export CSV"** instantly exports the filtered or full dataset formatted with headers ready for cooperative submission, financial audits, or Excel analysis.

---

## 3. Step-by-Step User Workflows

### Workflow 1: Logging a Daily Milking Record
1. Navigate to **Production** (`/production`) from the left sidebar.
2. Click the **"Log Milk Yield"** button in the top header.
3. Select the **Farm Facility** (if managing multiple farms).
4. Select or search for the **Animal** using their ear tag number or name.
5. Verify the **Production Date** (defaults to today; future dates are disabled).
6. Verify the **Milking Session** (auto-detected, or manually select Morning/Evening).
7. Enter the **Quantity (Liters)** (e.g., `14.5`).
8. *(Optional)* Enter **Fat %** (e.g., `3.8`), **Protein %** (e.g., `3.2`), and any session **Notes**.
9. Click **"Save Record"**. The table and summary KPIs will update in real time.

### Workflow 2: Filtering and Auditing Past Records
1. In the search box, type an animal tag (e.g. `TAG-0041`) to view its individual historical records.
2. Use the **Session** dropdown to inspect only evening yields.
3. Select **Quality Status: Rejected** or **Pending** to investigate flagged milk batches.
4. Click **"Clear Filters"** to return to the full overview.

### Workflow 3: Analyzing Lactation Trends
1. Examine the **7-Day Trend Chart** to detect any herd-level volume decline (often correlated with heat stress, dietary shifts, or weather changes).
2. Review the **Top Producers** chart to identify breeding candidates or high-performance donor cows for Artificial Insemination.

### Workflow 4: Exporting Data for Reports
1. Apply the desired date range (e.g. Start Date: `2026-09-01`, End Date: `2026-09-07`).
2. Click **"Export CSV"**.
3. A formatted `.csv` file named `milk_production_YYYY-MM-DD.csv` will download immediately to your local device.

---

## 4. Role-Based Permissions & Access Controls

| Role | View Records & Charts | Log Yields | Edit Records | Delete Records | Export Reports |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Admin** | All Farms | Yes | Yes | Yes | Yes |
| **Farm Owner / Manager** | Owned Farms | Yes | Yes | Yes | Yes |
| **Farm Worker** | Assigned Farms | Yes | No | No | No |
| **Veterinary Officer** | Authorized Farms | View Only | No | No | Yes |
| **Auditor / Govt Officer** | Region Scoped | View Only | No | No | Yes |

---

## 5. Data Integrity & Validation Rules

1. **Gestation & Withdrawal Isolation**: If an animal is under an active antibiotic withdrawal period (flagged via Health & Treatment records), milk must be marked as `REJECTED` or withheld from distribution.
2. **Session Uniqueness**: Only one record can exist for a given cow on a specific date and milking session.
3. **Volume Ranges**: Validated between `0.1` and `100.0` liters per session.
4. **Audit Trail**: Every record automatically links the authenticated user's ID (`recordedById`), creation timestamp, and update timestamp for non-repudiation.
