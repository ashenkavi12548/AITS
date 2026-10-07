import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { healthService } from "@/services/health.service";
import Toast from "react-native-toast-message";

type RecordType = "DIAGNOSIS" | "TREATMENT" | "VACCINATION";

const SEVERITY_OPTIONS = ["MILD", "MODERATE", "SEVERE", "CRITICAL"] as const;

export default function AddHealthScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFarmId } = useAuthStore();

  const [recordType, setRecordType] = useState<RecordType>("DIAGNOSIS");
  const [animalTag, setAnimalTag] = useState("");

  // Diagnosis fields
  const [condition, setCondition] = useState("");
  const [severity, setSeverity] = useState<string>("MODERATE");
  const [symptoms, setSymptoms] = useState("");

  // Treatment fields
  const [medication, setMedication] = useState("");
  const [dose, setDose] = useState("");
  const [duration, setDuration] = useState("");

  // Vaccination fields
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDose, setVaccineDose] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  // Shared
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const diagnosisMutation = useMutation({
    mutationFn: () =>
      healthService.createDiagnosis({
        animalTag: animalTag.trim(),
        condition: condition.trim(),
        severity,
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes.trim() || undefined,
        recordDate: today,
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Diagnosis recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed to record diagnosis", text2: err.message });
    },
  });

  const treatmentMutation = useMutation({
    mutationFn: () =>
      healthService.createTreatment({
        animalTag: animalTag.trim(),
        medication: medication.trim(),
        dose: dose.trim() || undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
        startDate: today,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Treatment recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed to record treatment", text2: err.message });
    },
  });

  const vaccinationMutation = useMutation({
    mutationFn: () =>
      healthService.createVaccination({
        animalTag: animalTag.trim(),
        vaccineName: vaccineName.trim(),
        dose: vaccineDose.trim(),
        vaccinationDate: today,
        batchNumber: batchNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Vaccination recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed to record vaccination", text2: err.message });
    },
  });

  const isSubmitting =
    diagnosisMutation.isPending ||
    treatmentMutation.isPending ||
    vaccinationMutation.isPending;

  const handleSubmit = useCallback(() => {
    if (!animalTag.trim()) {
      Toast.show({ type: "error", text1: "Animal tag is required" });
      return;
    }

    switch (recordType) {
      case "DIAGNOSIS":
        if (!condition.trim()) {
          Toast.show({ type: "error", text1: "Condition is required" });
          return;
        }
        diagnosisMutation.mutate();
        break;
      case "TREATMENT":
        if (!medication.trim()) {
          Toast.show({ type: "error", text1: "Medication is required" });
          return;
        }
        treatmentMutation.mutate();
        break;
      case "VACCINATION":
        if (!vaccineName.trim() || !vaccineDose.trim()) {
          Toast.show({ type: "error", text1: "Vaccine name and dose are required" });
          return;
        }
        vaccinationMutation.mutate();
        break;
    }
  }, [
    animalTag,
    recordType,
    condition,
    medication,
    vaccineName,
    vaccineDose,
    diagnosisMutation,
    treatmentMutation,
    vaccinationMutation,
  ]);

  const typeColors: Record<RecordType, { bg: string; active: string }> = {
    DIAGNOSIS: { bg: "#fef2f2", active: "#ef4444" },
    TREATMENT: { bg: "#fff7ed", active: "#f59e0b" },
    VACCINATION: { bg: "#f0fdf4", active: "#10b981" },
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Record Type Selector */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Record Type
          </Text>
          <View className="flex-row gap-2">
            {(["DIAGNOSIS", "TREATMENT", "VACCINATION"] as RecordType[]).map(
              (type) => (
                <TouchableOpacity
                  key={type}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor:
                      recordType === type
                        ? typeColors[type].active
                        : typeColors[type].bg,
                  }}
                  onPress={() => setRecordType(type)}
                >
                  <MaterialCommunityIcons
                    name={
                      type === "DIAGNOSIS"
                        ? "stethoscope"
                        : type === "TREATMENT"
                          ? "pill"
                          : "needle"
                    }
                    size={20}
                    color={recordType === type ? "#fff" : typeColors[type].active}
                  />
                  <Text
                    className="text-xs font-bold mt-1"
                    style={{
                      color:
                        recordType === type ? "#fff" : typeColors[type].active,
                    }}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

        {/* Animal Tag */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Animal Tag *
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
            placeholder="e.g. ZA-2024-001"
            placeholderTextColor="#94a3b8"
            value={animalTag}
            onChangeText={setAnimalTag}
            autoCapitalize="characters"
          />
        </View>

        {/* Conditional Fields */}
        {recordType === "DIAGNOSIS" && (
          <>
            <View className="px-4 pt-4">
              <Text className="text-sm font-semibold text-slate-600 mb-2">
                Condition / Diagnosis *
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                placeholder="e.g. Mastitis, Foot Rot"
                placeholderTextColor="#94a3b8"
                value={condition}
                onChangeText={setCondition}
              />
            </View>

            <View className="px-4 pt-4">
              <Text className="text-sm font-semibold text-slate-600 mb-2">
                Severity
              </Text>
              <View className="flex-row gap-2">
                {SEVERITY_OPTIONS.map((sev) => (
                  <TouchableOpacity
                    key={sev}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        severity === sev ? "#ef4444" : "#fff",
                      borderWidth: 1,
                      borderColor:
                        severity === sev ? "#ef4444" : "#e2e8f0",
                    }}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: severity === sev ? "#fff" : "#64748b",
                      }}
                    >
                      {sev}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="px-4 pt-4">
              <Text className="text-sm font-semibold text-slate-600 mb-2">
                Symptoms (comma-separated)
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                placeholder="e.g. Fever, Swelling, Limping"
                placeholderTextColor="#94a3b8"
                value={symptoms}
                onChangeText={setSymptoms}
              />
            </View>
          </>
        )}

        {recordType === "TREATMENT" && (
          <>
            <View className="px-4 pt-4">
              <Text className="text-sm font-semibold text-slate-600 mb-2">
                Medication *
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                placeholder="e.g. Penicillin, Oxytetracycline"
                placeholderTextColor="#94a3b8"
                value={medication}
                onChangeText={setMedication}
              />
            </View>

            <View className="flex-row px-4 pt-4 gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-600 mb-2">
                  Dose
                </Text>
                <TextInput
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                  placeholder="e.g. 10ml"
                  placeholderTextColor="#94a3b8"
                  value={dose}
                  onChangeText={setDose}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-600 mb-2">
                  Duration (days)
                </Text>
                <TextInput
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                  placeholder="e.g. 5"
                  placeholderTextColor="#94a3b8"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </>
        )}

        {recordType === "VACCINATION" && (
          <>
            <View className="px-4 pt-4">
              <Text className="text-sm font-semibold text-slate-600 mb-2">
                Vaccine Name *
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                placeholder="e.g. FMD Vaccine, Anthrax"
                placeholderTextColor="#94a3b8"
                value={vaccineName}
                onChangeText={setVaccineName}
              />
            </View>

            <View className="flex-row px-4 pt-4 gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-600 mb-2">
                  Dose *
                </Text>
                <TextInput
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                  placeholder="e.g. 2ml"
                  placeholderTextColor="#94a3b8"
                  value={vaccineDose}
                  onChangeText={setVaccineDose}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-600 mb-2">
                  Batch No.
                </Text>
                <TextInput
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
                  placeholder="e.g. BN-2024-01"
                  placeholderTextColor="#94a3b8"
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                />
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Notes
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
            placeholder="Additional observations..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </View>

        {/* Date badge */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color="#64748b"
            />
            <Text className="text-sm text-slate-600 ml-2">
              Recording for: <Text className="font-bold">{today}</Text>
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4 pt-6">
          <TouchableOpacity
            className="rounded-xl py-4 items-center justify-center"
            style={{
              backgroundColor: typeColors[recordType].active,
              opacity: isSubmitting ? 0.7 : 1,
              elevation: 4,
              shadowColor: typeColors[recordType].active,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-lg font-bold">
                  Submit{" "}
                  {recordType.charAt(0) + recordType.slice(1).toLowerCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
