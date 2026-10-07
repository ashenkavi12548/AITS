import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { AnimalDetailResponse } from "@/types/animals";
import { healthService } from "@/services/health.service";
import { Spacing, Colors } from "@/constants/theme";
import { CompactAnimalSummary } from "@/components/animal/CompactAnimalSummary";
import { RecordTimestamp } from "@/components/common/RecordTimestamp";

type HealthType = "VACCINATION" | "TREATMENT" | "DIAGNOSIS";

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: HealthType;
  setActiveTab: (t: HealthType) => void;
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "VACCINATION" && styles.tabActive]}
        onPress={() => setActiveTab("VACCINATION")}
      >
        <MaterialCommunityIcons
          name="needle"
          size={20}
          color={
            activeTab === "VACCINATION" ? Colors.dark.secondary : "#475569"
          }
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "VACCINATION" && styles.tabTextActive,
          ]}
        >
          VACCINE
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "TREATMENT" && styles.tabActive]}
        onPress={() => setActiveTab("TREATMENT")}
      >
        <MaterialCommunityIcons
          name="pill"
          size={20}
          color={activeTab === "TREATMENT" ? Colors.dark.secondary : "#475569"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "TREATMENT" && styles.tabTextActive,
          ]}
        >
          MEDS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "DIAGNOSIS" && styles.tabActive]}
        onPress={() => setActiveTab("DIAGNOSIS")}
      >
        <MaterialCommunityIcons
          name="stethoscope"
          size={20}
          color={activeTab === "DIAGNOSIS" ? Colors.dark.secondary : "#475569"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "DIAGNOSIS" && styles.tabTextActive,
          ]}
        >
          DIAGNOSE
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function LogHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);

  const [activeTab, setActiveTab] = useState<HealthType>("VACCINATION");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common Field
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Vaccination Fields
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDose, setVaccineDose] = useState("");

  // Treatment Fields
  const [medication, setMedication] = useState("");
  const [treatmentDose, setTreatmentDose] = useState("");
  const [duration, setDuration] = useState("");

  // Diagnosis Fields
  const [condition, setCondition] = useState("");
  const [severity, setSeverity] = useState("low");

  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    if (activeTab === "TREATMENT" && animal?.animalNumber) {
      const fetchCases = async () => {
        setLoadingCases(true);
        try {
          const res = await healthService.getDiagnoses({ search: animal.animalNumber, status: "ACTIVE" });
          setActiveCases(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedCaseId(res.data[0].id);
          } else {
            setSelectedCaseId("");
          }
        } catch (e) {
          console.error("Failed to fetch cases", e);
        } finally {
          setLoadingCases(false);
        }
      };
      fetchCases();
    }
  }, [activeTab, animal?.animalNumber]);

  if (!animal) return null;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === "VACCINATION") {
        if (!vaccineName || !vaccineDose)
          throw new Error("VACCINE DATA MISSING.");
        await healthService.createVaccination({
          animalTag: animal.animalNumber,
          vaccineName,
          dose: vaccineDose,
          vaccinationDate: date,
          notes: notes || undefined,
        });
      } else if (activeTab === "TREATMENT") {
        if (!medication || !treatmentDose || !duration)
          throw new Error("TREATMENT DATA MISSING.");
        if (!selectedCaseId)
          throw new Error("ACTIVE DIAGNOSIS IS REQUIRED FOR TREATMENT.");
        await healthService.createTreatment({
          animalTag: animal.animalNumber,
          medication,
          dose: treatmentDose,
          duration: parseInt(duration, 10),
          startDate: date,
          caseId: selectedCaseId,
          notes: notes || undefined,
        });
      } else if (activeTab === "DIAGNOSIS") {
        if (!condition) throw new Error("CONDITION DATA MISSING.");
        await healthService.createDiagnosis({
          animalTag: animal.animalNumber,
          condition,
          severity,
          recordDate: date,
          notes: notes || undefined,
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Medical record synchronized.",
      });
      router.back();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "TRANSMISSION FAILED";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOG MEDICAL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <CompactAnimalSummary animal={animal} />

        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

        <RecordTimestamp />

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={Colors.dark.secondary}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BUSINESS DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === "date" && styles.inputFocused,
              ]}
              value={date}
              onChangeText={setDate}
              onFocus={() => setFocusedInput("date")}
              onBlur={() => setFocusedInput(null)}
              placeholderTextColor="#475569"
            />
          </View>

          {activeTab === "VACCINATION" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>VACCINE ID</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "vName" && styles.inputFocused,
                  ]}
                  value={vaccineName}
                  onChangeText={setVaccineName}
                  placeholder="e.g. FMD-V"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("vName")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DOSAGE</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "vDose" && styles.inputFocused,
                  ]}
                  value={vaccineDose}
                  onChangeText={setVaccineDose}
                  placeholder="e.g. 2ml"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("vDose")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </>
          )}

          {activeTab === "TREATMENT" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>LINK TO DIAGNOSIS</Text>
                {loadingCases ? (
                  <Text style={{ color: Colors.dark.textSecondary, marginBottom: 16 }}>Loading diagnoses...</Text>
                ) : activeCases.length === 0 ? (
                  <Text style={{ color: "#ef4444", marginBottom: 16, fontWeight: "bold" }}>
                    No active diagnosis found. Create a diagnosis first.
                  </Text>
                ) : (
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="medical-outline"
                      size={20}
                      color={Colors.dark.textSecondary}
                      style={{ position: "absolute", zIndex: 1, left: 12 }}
                    />
                    <TextInput
                      style={[styles.input, { paddingLeft: 40 }]}
                      placeholder="Selected Case ID"
                      placeholderTextColor={Colors.dark.textSecondary}
                      value={
                        activeCases.find((c) => c.id === selectedCaseId)?.condition || ""
                      }
                      editable={false}
                    />
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MEDICATION ID</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "med" && styles.inputFocused,
                  ]}
                  value={medication}
                  onChangeText={setMedication}
                  placeholder="e.g. Penicillin"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("med")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DOSAGE</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "tDose" && styles.inputFocused,
                  ]}
                  value={treatmentDose}
                  onChangeText={setTreatmentDose}
                  placeholder="e.g. 10ml"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("tDose")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DURATION (DAYS)</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "dur" && styles.inputFocused,
                  ]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("dur")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </>
          )}

          {activeTab === "DIAGNOSIS" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONDITION IDENTIFIER</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "cond" && styles.inputFocused,
                  ]}
                  value={condition}
                  onChangeText={setCondition}
                  placeholder="e.g. Mastitis"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("cond")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SEVERITY LEVEL</Text>
                <View style={styles.chipScroll}>
                  {["low", "moderate", "high", "critical"].map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.chip,
                        severity === sev && styles.chipActiveSeverity,
                      ]}
                      onPress={() => setSeverity(sev)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          severity === sev && styles.chipTextActiveSev,
                        ]}
                      >
                        {sev.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ADDITIONAL OBSERVATIONS</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                focusedInput === "notes" && styles.inputFocused,
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="OPTIONAL"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              onFocus={() => setFocusedInput("notes")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.dark.background} />
          ) : (
            <Text style={styles.submitButtonText}>TRANSMIT {activeTab}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0d0d0d" },
  formContainer: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: Spacing.six },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { marginLeft: 6, fontSize: 12, fontWeight: "600", color: "#5d5d5d" },
  tabTextActive: { color: Colors.light.primary },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  inputGroup: { marginBottom: Spacing.four },
  inputContainer: { position: "relative", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#5d5d5d", marginBottom: 8 },
  input: {
    backgroundColor: "#f4f4f4",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0d0d0d",
  },
  inputFocused: {
    borderColor: Colors.light.primary,
    backgroundColor: "#ffffff",
  },
  inputDisabled: { opacity: 0.6, backgroundColor: "#e5e5e5", color: "#6b7280" },
  textArea: { height: 80, textAlignVertical: "top" },
  chipScroll: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  chipActiveSeverity: { backgroundColor: "#fef2f2", borderColor: "#ef4444" },
  chipText: { fontSize: 13, color: "#5d5d5d", fontWeight: "600" },
  chipTextActiveSev: { color: "#ef4444" },
  footer: {
    padding: Spacing.four,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  submitButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
