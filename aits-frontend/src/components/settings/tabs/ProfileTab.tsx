"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  User,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  Phone,
  Mail,
  CreditCard,
  Languages,
  BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { authService } from "@/services/auth.service";
import { getRoleDisplayConfig } from "@/utils/role.utils";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z
    .string()
    .trim()
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "Primary Mobile Phone must be exactly 10 digits.",
    }),
  emergencyPhone: z
    .string()
    .trim()
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "Emergency Contact Phone must be exactly 10 digits.",
    }),
  nicNumber: z
    .string()
    .trim()
    .refine((val) => val === "" || /^([0-9]{9}[xXvV]|[0-9]{12})$/.test(val), {
      message: "NIC must be 9 digits followed by V/X or 12 digits.",
    }),
  language: z.enum(["EN", "SI", "TA"], {
    message: "Please select a valid language.",
  }),
  operatorNotes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional(),
});

export default function ProfileTab() {
  const { user, updateUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("+94 71 889 4210");
  const [nicNumber, setNicNumber] = useState("199428501234");
  const [language, setLanguage] = useState<"EN" | "SI" | "TA">("EN");
  const [operatorNotes, setOperatorNotes] = useState(
    "Certified dairy herd manager and primary RFID tagging operator.",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const parsed = profileSchema.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      emergencyPhone: emergencyPhone.trim(),
      nicNumber: nicNumber.trim(),
      language,
      operatorNotes: operatorNotes.trim(),
    });

    if (!parsed.success) {
      const err = parsed.error.issues[0].message;
      setStatusMsg({ type: "error", text: err });
      toast.error(err);
      return;
    }

    setIsSaving(true);
    const updatedFirst = firstName.trim();
    const updatedLast = lastName.trim();
    const updatedPhone = phone.trim();
    const updatedFullName = `${updatedFirst} ${updatedLast}`;

    try {
      const res = await authService.updateProfile({
        firstName: updatedFirst,
        lastName: updatedLast,
        phone: updatedPhone,
      });

      updateUser({
        firstName: updatedFirst,
        lastName: updatedLast,
        fullName: updatedFullName,
        phone: updatedPhone,
      });

      const successMsg =
        res.message || "Operator credentials updated successfully.";
      setStatusMsg({ type: "success", text: successMsg });
      toast.success(successMsg);
      setIsEditing(false);
    } catch (err: unknown) {
      let msg = "Failed to update operator profile.";
      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as { response?: { data?: { message?: string | string[] } } }
        ).response;
        if (response?.data?.message) {
          msg = Array.isArray(response.data.message)
            ? response.data.message.join(", ")
            : response.data.message;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }

      // Local optimistic fallback
      updateUser({
        firstName: updatedFirst,
        lastName: updatedLast,
        fullName: updatedFullName,
        phone: updatedPhone,
      });

      setStatusMsg({ type: "error", text: msg });
      toast.error(msg);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Left Column: Interactive Operator Badge Card */}
      <div className="space-y-6">
        {/* Operator ID Badge Card */}
        <div className="bg-linear-to-br from-white via-white to-emerald-50/40 dark:from-[#262626] dark:via-[#262626] dark:to-[#1a2f26] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10a37f]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#737373] dark:text-[#8e8e8e]">
                Operator Identification
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f4f4] dark:bg-[#1e1e1e] text-[#737373] dark:text-[#8e8e8e] border border-[#e5e5e5] dark:border-[#333]">
              ID: {user?.id ? user.id.slice(0, 8).toUpperCase() : "OP-8291"}
            </span>
          </div>

          <div className="pt-5 pb-3 text-center flex flex-col items-center">
            <ProfileAvatarUpload />

            <div className="mt-3">
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center justify-center gap-1.5">
                {user?.fullName ||
                  `${firstName} ${lastName}` ||
                  "Active Operator"}
                <BadgeCheck className="w-4 h-4 text-[#10a37f]" />
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                {user?.email || "operator@aits.lk"}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                {getRoleDisplayConfig(user?.farmRole || user?.role)?.label ||
                  "Verified Operator"}
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Verified
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#383838] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#8e8e8e]">
              <span>Registered Farm</span>
              <span className="font-semibold text-[#0d0d0d] dark:text-white truncate max-w-37.5">
                {user?.primaryFarmName || "Main Livestock Facility"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#737373] dark:text-[#8e8e8e]">
              <span>NIC Number</span>
              <span className="font-mono text-[#0d0d0d] dark:text-white">
                {nicNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#737373] dark:text-[#8e8e8e]">
              <span>Preferred Language</span>
              <span className="font-semibold text-[#0d0d0d] dark:text-white">
                {language === "EN"
                  ? "English"
                  : language === "SI"
                    ? "Sinhala"
                    : "Tamil"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Identity Actions Card */}
        <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#10a37f]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
              Digital ID Card
            </h3>
          </div>
          <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
            Quick identification code for field inspections, milk collection
            centers, and official farm audits.
          </p>
          <div className="p-3 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-dashed border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#0d0d0d] dark:text-white font-mono">
              <ShieldCheck className="w-4 h-4 text-[#10a37f]" />
              <span>
                ID:{" "}
                {user?.id
                  ? user.id.slice(0, 12).toUpperCase()
                  : "AITS-VERIFIED"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(user?.id || "AITS-ID");
                toast.success("Operator ID copied to clipboard");
              }}
              className="text-[11px] font-semibold text-[#10a37f] hover:underline cursor-pointer"
            >
              Copy ID
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Editable Operator Credentials Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                  Operator Credentials & Personal Identity
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                  Manage contact phone numbers, National ID, and field operation
                  profiles.
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] text-xs font-semibold border border-[#10a37f]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white text-xs font-semibold border border-[#e5e5e5] dark:border-[#383838] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMsg.type === "success"
                  ? "bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {!isEditing ? (
            /* Read-Only Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  First Name
                </span>
                <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                  {user?.firstName || firstName || "—"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  Last Name
                </span>
                <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                  {user?.lastName || lastName || "—"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#737373] dark:text-[#8e8e8e] font-medium">
                    Primary Email
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Verified
                  </span>
                </div>
                <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white truncate block">
                  {user?.email || "—"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  Primary Mobile Phone
                </span>
                <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                  {user?.phone || phone || "Not provided"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  Emergency Field Contact
                </span>
                <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                  {emergencyPhone}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  National Identity Card (NIC)
                </span>
                <span className="font-semibold text-sm font-mono text-[#0d0d0d] dark:text-white">
                  {nicNumber}
                </span>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                  Field Operator Notes & Qualifications
                </span>
                <p className="text-xs text-[#0d0d0d] dark:text-white leading-relaxed">
                  {operatorNotes}
                </p>
              </div>
            </div>
          ) : (
            /* Interactive Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Ruwan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Bandara"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Primary Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#e5e5e5]/50 dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] text-[#737373] dark:text-[#8e8e8e] cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setPhone(val);
                      }}
                      placeholder="0771234567"
                      maxLength={10}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setEmergencyPhone(val);
                    }}
                    placeholder="0718894210"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    National Identity Card (NIC)
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                    <input
                      type="text"
                      value={nicNumber}
                      onChange={(e) => setNicNumber(e.target.value)}
                      placeholder="199428501234 or 942851234V"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Preferred System Language
                  </label>
                  <div className="relative">
                    <Languages className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                    <select
                      value={language}
                      onChange={(e) =>
                        setLanguage(e.target.value as "EN" | "SI" | "TA")
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium cursor-pointer"
                    >
                      <option value="EN">
                        English (Sri Lanka & International)
                      </option>
                      <option value="SI">සිංහල (Sinhala)</option>
                      <option value="TA">தமிழ் (Tamil)</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                    Operator Notes & Accreditations
                  </label>
                  <textarea
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    rows={3}
                    placeholder="Add operational notes or veterinary certifications..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium resize-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#e5e5e5] dark:border-[#383838]">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-semibold transition-all shadow-md shadow-[#10a37f]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSaving ? "Saving Updates..." : "Save Profile Changes"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white font-semibold border border-[#e5e5e5] dark:border-[#383838] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
