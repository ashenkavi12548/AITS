"use client";

import React from "react";
import { toast } from "react-hot-toast";
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Syringe,
  Heart,
  TrendingDown,
  Truck,
} from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export default function NotificationsTab() {
  const {
    notifications,
    updateNotificationChannels,
    updateNotificationAlerts,
  } = useSettingsStore();

  const handleChannelToggle = (
    channel: keyof typeof notifications.channels,
    val: boolean,
  ) => {
    updateNotificationChannels({ [channel]: val });
    toast.success(
      `Notification channel ${channel.toUpperCase()} ${val ? "enabled" : "disabled"}`,
    );
  };

  const handleAlertToggle = (
    alertKey: keyof typeof notifications.alerts,
    val: boolean,
  ) => {
    updateNotificationAlerts({ [alertKey]: val });
    toast.success(`Alert trigger preference updated`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Delivery Channels Card */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
              Notification Delivery Channels
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Configure where and how you wish to receive urgent operational
              dispatches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* In-App Notifications */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-center gap-3 pr-2">
              <div className="p-2 rounded-lg bg-[#10a37f]/10 text-[#10a37f] dark:text-[#12b88f] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  In-App Notification Bell
                </span>
                <p className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e]">
                  Header alerts & badges
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.channels.inApp}
                onChange={(e) => handleChannelToggle("inApp", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>

          {/* Email Channel */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-center gap-3 pr-2">
              <div className="p-2 rounded-lg bg-[#10a37f]/10 text-[#10a37f] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  Email Summaries
                </span>
                <p className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e]">
                  Daily & incident reports
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.channels.email}
                onChange={(e) => handleChannelToggle("email", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>

          {/* SMS Channel */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-center gap-3 pr-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  SMS Mobile Alerts
                </span>
                <p className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e]">
                  High-priority field texts
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.channels.sms}
                onChange={(e) => handleChannelToggle("sms", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Operational Trigger Subscriptions */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          Livestock Tracing & Farm Operational Event Alerts
        </h3>

        <div className="space-y-3 text-xs">
          {/* Disease Outbreak & Bio-Security Quarantine */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0d0d0d] dark:text-white">
                    Bio-Security & Disease Outbreak Quarantines
                  </span>
                  <span className="px-2 py-0.2 text-[9.5px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    CRITICAL
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  Instant alert if veterinary authority declares Foot & Mouth
                  (FMD) or contagious quarantine in your divisional secretariat.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.alerts.diseaseOutbreak}
                onChange={(e) =>
                  handleAlertToggle("diseaseOutbreak", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>

          {/* Vaccination Due Reminders */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-[#10a37f] shrink-0">
                <Syringe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  Vaccination & Deworming Protocol Reminders
                </span>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  Proactive advance reminders before scheduled booster doses and
                  Brucellosis tests.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <select
                value={notifications.alerts.vaccinationReminderDays}
                onChange={(e) =>
                  updateNotificationAlerts({
                    vaccinationReminderDays: Number(e.target.value),
                  })
                }
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-[#2b2b2b] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white font-medium cursor-pointer"
              >
                <option value={1}>1 Day Before</option>
                <option value={3}>3 Days Before</option>
                <option value={7}>7 Days Before</option>
              </select>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.alerts.vaccinationDueReminder}
                  onChange={(e) =>
                    handleAlertToggle(
                      "vaccinationDueReminder",
                      e.target.checked,
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
              </label>
            </div>
          </div>

          {/* Breeding & Calving Alerts */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  Estrous Heat Window & Calving Warnings
                </span>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  Notifies AI technicians and herd managers when cow cycle
                  enters insemination readiness or reaches parturition due date.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.alerts.expectedCalvingAlert}
                onChange={(e) =>
                  handleAlertToggle("expectedCalvingAlert", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>

          {/* Milk Yield Anomaly Drop */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  Milk Production Drop Anomaly
                </span>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  Flags cows or bulk parlor batches whose daily production drops
                  below rolling baseline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                Drop &gt; {notifications.alerts.milkDropThresholdPercent}%
              </span>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.alerts.milkYieldAnomaly}
                  onChange={(e) =>
                    handleAlertToggle("milkYieldAnomaly", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
              </label>
            </div>
          </div>

          {/* Livestock Movement & Transfer Alert */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0d0d0d] dark:text-white block">
                  Livestock Transfer & Transportation Manifests
                </span>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  Alerts when animals registered to your BRN are assigned to an
                  outgoing transport or receiving checkpoint.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifications.alerts.unauthorizedMovement}
                onChange={(e) =>
                  handleAlertToggle("unauthorizedMovement", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
