import React from "react";
import { History, User } from "lucide-react";
import { AnimalHistoryItem } from "@/services/animals.service";

function formatAuditAction(action: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (action) {
    case "REGISTER_ANIMAL":
      return {
        label: "Animal Registered & Tagged",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800",
      };
    case "UPDATE_ANIMAL":
      return {
        label: "Profile Details Updated",
        bg: "bg-[#10a37f]/5 dark:bg-[#10a37f]/30/40",
        text: "text-[#0e8c6d] dark:text-[#12b88f]",
        border: "border-[#10a37f]/20 dark:border-[#10a37f]/60",
      };
    case "CHANGE_ANIMAL_STATUS":
      return {
        label: "Lifecycle Status Transition",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
      };
    case "ADD_IDENTIFIER":
      return {
        label: "Physical Identifier Attached",
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
      };
    case "REPLACE_QR_CODE":
      return {
        label: "Ear Tag QR Replaced",
        bg: "bg-[#10a37f]/5 dark:bg-[#10a37f]/30/40",
        text: "text-[#0e8c6d] dark:text-[#12b88f]",
        border: "border-[#10a37f]/20 dark:border-[#10a37f]/60",
      };
    case "DEACTIVATE_QR_CODE":
      return {
        label: "Ear Tag Deactivated",
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-800",
      };
    default:
      return {
        label: action
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        bg: "bg-gray-100 dark:bg-[#333]",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
      };
  }
}

/**
 * Transforms raw audit oldValues/newValues JSON into friendly, human-readable cards and diffs
 */
function renderHumanReadableChanges(log: AnimalHistoryItem) {
  const { action, oldValues, newValues } = log;

  // 1. Status Change
  if (action === "CHANGE_ANIMAL_STATUS") {
    const oldStatus = (oldValues?.status as string) || "ACTIVE";
    const newStatus = (newValues?.status as string) || "UNKNOWN";
    const reason = (newValues?.reason as string) || "";
    const notes = (newValues?.notes as string) || "";

    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">
            Status Transition:
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300">
            {oldStatus}
          </span>
          <span className="text-gray-400">&rarr;</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {newStatus}
          </span>
        </div>
        {reason && (
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Reason:{" "}
            </span>
            {reason}
          </p>
        )}
        {notes && (
          <p className="text-[11px] text-gray-500 italic bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
            &ldquo;{notes}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // 2. Animal Registration
  if (action === "REGISTER_ANIMAL") {
    const tag = (newValues?.animalNumber as string) || "";
    const breed = (newValues?.breed as string) || "";
    const gender = (newValues?.gender as string) || "";
    const weight = newValues?.weight ? `${newValues.weight} kg` : null;

    return (
      <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-gray-300">
        <p>
          Initial livestock registration as{" "}
          <strong className="text-[#0d0d0d] dark:text-white font-semibold">
            {breed}
          </strong>{" "}
          ({gender === "FEMALE" ? "Cow" : "Bull"}).
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {tag && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
              Ear Tag: {tag}
            </span>
          )}
          {weight && (
            <span className="px-2 py-0.5 rounded-md bg-[#10a37f]/5 dark:bg-[#10a37f]/30/40 text-[#0e8c6d] dark:text-[#12b88f] text-[11px] font-bold">
              Weight: {weight}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 3. Add Identifier
  if (action === "ADD_IDENTIFIER") {
    const type = (newValues?.identifierType as string) || "Identifier";
    const value = (newValues?.identifierValue as string) || "";
    const isPrimary = Boolean(newValues?.isPrimary);

    return (
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
        <p>
          Attached new <strong>{type}</strong> tag to this animal.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono font-bold text-[11px] border border-purple-200 dark:border-purple-800">
            {value}
          </span>
          {isPrimary && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase">
              Primary
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Replace QR Code
  if (action === "REPLACE_QR_CODE") {
    const reason =
      (oldValues?.reason as string) ||
      (newValues?.reason as string) ||
      "Damaged or faded tag";
    const notes =
      (oldValues?.notes as string) || (newValues?.notes as string) || "";

    return (
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
        <p>
          Generated a new active cryptographic QR ear tag and archived the
          previous badge.
        </p>
        <p className="text-[11.5px] text-gray-500">
          <strong>Reported Reason:</strong> {reason}
        </p>
        {notes && (
          <p className="text-[11px] text-gray-400 italic">
            &ldquo;{notes}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // 5. Update Animal Traits
  if (action === "UPDATE_ANIMAL" && (oldValues || newValues)) {
    const changes: { label: string; from: string; to: string }[] = [];
    const fields: Record<string, string> = {
      name: "Name / Nickname",
      breed: "Breed",
      species: "Species",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      color: "Color / Markings",
      weight: "Weight (kg)",
      imageUrl: "Photograph",
    };

    const keys = Array.from(
      new Set([
        ...Object.keys(oldValues || {}),
        ...Object.keys(newValues || {}),
      ]),
    );
    for (const k of keys) {
      if (!fields[k]) continue;
      const fromVal = oldValues ? String(oldValues[k] ?? "—") : "—";
      const toVal = newValues ? String(newValues[k] ?? "—") : "—";
      if (fromVal !== toVal) {
        changes.push({
          label: fields[k],
          from: k === "imageUrl" ? "Previous Photo" : fromVal,
          to: k === "imageUrl" ? "New Photo Uploaded" : toVal,
        });
      }
    }

    if (changes.length > 0) {
      return (
        <div className="mt-2 space-y-1.5">
          {changes.map((ch, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs flex-wrap"
            >
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-28">
                {ch.label}:
              </span>
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#333] text-gray-500 line-through text-[11px]">
                {ch.from}
              </span>
              <span className="text-gray-400">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#10a37f] font-bold text-[11px]">
                {ch.to}
              </span>
            </div>
          ))}
        </div>
      );
    }
  }

  // Fallback: render human-readable key-value chips without JSON syntax
  const combined = { ...(oldValues || {}), ...(newValues || {}) };
  const entries = Object.entries(combined).filter(
    ([k]) =>
      ![
        "id",
        "createdAt",
        "updatedAt",
        "userId",
        "ipAddress",
        "userAgent",
        "farmId",
      ].includes(k),
  );

  if (entries.length === 0) {
    return (
      <p className="mt-1 text-xs text-gray-500 italic">
        Audit modification verified and committed to immutable event log.
      </p>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
      {entries.map(([k, v]) => {
        const readableKey = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
        const readableVal =
          typeof v === "object" && v !== null
            ? Object.values(v).join(", ")
            : String(v ?? "None");
        return (
          <div
            key={k}
            className="p-2 rounded-xl bg-gray-50 dark:bg-[#202020] border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
          >
            <span className="text-gray-500 text-[11px]">{readableKey}:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-[11px] truncate max-w-44">
              {readableVal}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HumanAuditTimeline({ logs }: { logs: AnimalHistoryItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 space-y-2">
        <History className="w-8 h-8 mx-auto opacity-30 text-[#10a37f]" />
        <p className="text-xs font-semibold text-gray-500">
          No audit modifications recorded yet.
        </p>
        <p className="text-[11px] text-gray-400">
          All identity and lifecycle updates will appear here in chronological
          order.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
      {logs.map((h) => {
        const meta = formatAuditAction(h.action);
        return (
          <div key={h.id} className="relative group">
            {/* Timeline node marker */}
            <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white dark:bg-[#242424] border-2 border-[#10a37f] flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/50 transition-all space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  {meta.label}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {new Date(h.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {renderHumanReadableChanges(h)}

              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Recorded by:{" "}
                    <strong className="text-gray-700 dark:text-gray-200 font-semibold">
                      {h.user?.name || "System Operator"}
                    </strong>
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
