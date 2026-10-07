import React, { useState } from "react";
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
import { breedingService } from "@/services/breeding.service";
import { Spacing, Colors } from "@/constants/theme";
import { CompactAnimalSummary } from "@/components/animal/CompactAnimalSummary";
import { RecordTimestamp } from "@/components/common/RecordTimestamp";
import {
  BreedingMethod,
  PregnancyCheckType,
  PregnancyStatus,
  CalvingStatus,
} from "@/types/breeding";

type BreedingTab = "SERVICE" | "PREGNANCY" | "CALVING";

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: BreedingTab;
  setActiveTab: (t: BreedingTab) => void;
}) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tab, activeTab === "SERVICE" && styles.tabActive]}
      onPress={() => setActiveTab("SERVICE")}
    >
      <MaterialCommunityIcons
        name="heart-pulse"
        size={20}
        color={activeTab === "SERVICE" ? Colors.dark.accent : "#475569"}
      />
      <Text
        style={[
          styles.tabText,
          activeTab === "SERVICE" && styles.tabTextActive,
        ]}
      >
        SERVICE
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tab, activeTab === "PREGNANCY" && styles.tabActive]}
      onPress={() => setActiveTab("PREGNANCY")}
    >
      <MaterialCommunityIcons
        name="magnify-scan"
        size={20}
        color={activeTab === "PREGNANCY" ? Colors.dark.accent : "#475569"}
      />
      <Text
        style={[
          styles.tabText,
          activeTab === "PREGNANCY" && styles.tabTextActive,
        ]}
      >
        CHECK
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tab, activeTab === "CALVING" && styles.tabActive]}
      onPress={() => setActiveTab("CALVING")}
    >
      <MaterialCommunityIcons
        name="cow"
        size={20}
        color={activeTab === "CALVING" ? Colors.dark.accent : "#475569"}
      />
      <Text
        style={[
          styles.tabText,
          activeTab === "CALVING" && styles.tabTextActive,
        ]}
      >
        CALVING
      </Text>
    </TouchableOpacity>
  </View>
);

export default function LogBreedingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);

  const [activeTab, setActiveTab] = useState<BreedingTab>("SERVICE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Service Fields
  const [method, setMethod] = useState<BreedingMethod>(
    "ARTIFICIAL_INSEMINATION",
  );
  const [sire, setSire] = useState("");
  const [technician, setTechnician] = useState("");

  // Pregnancy Fields
  const [checkType, setCheckType] =
    useState<PregnancyCheckType>("60_DAY_CHECK");
  const [pregStatus, setPregStatus] = useState<PregnancyStatus>("CONFIRMED");

  // Calving Fields
  const [calvingStatus, setCalvingStatus] =
    useState<CalvingStatus>("COMPLETED");
  const [calfGender, setCalfGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [calfWeight, setCalfWeight] = useState("");

  if (!animal) return null;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === "SERVICE") {
        if (!sire) throw new Error("SIRE IDENTIFIER REQUIRED.");
        await breedingService.createBreedingRecord({
          femaleAnimalId: animal.id,
          farmId: animal.farmId,
          serviceMethod: method,
          bullTag: method === "NATURAL_BREEDING" ? sire : undefined,
          semenStrawId: method === "ARTIFICIAL_INSEMINATION" ? sire : undefined,
          serviceDate: date,
          technician: technician || "Automated System",
          attemptNumber: 1,
          notes: notes || undefined,
        });
      } else if (activeTab === "PREGNANCY") {
        await breedingService.createPregnancyCheck({
          femaleAnimalId: animal.id,
          farmId: animal.farmId,
          checkDate: date,
          checkType,
          checkMethod: "UNKNOWN",
          pregnancyStatus: pregStatus,
          technicianOrVet: technician || "Automated System",
          notes: notes || undefined,
        });
      } else if (activeTab === "CALVING") {
        await breedingService.createCalvingRecord({
          motherAnimalId: animal.id,
          farmId: animal.farmId,
          expectedCalvingDate: date,
          actualCalvingDate: date,
          calvingStatus,
          numberOfCalves: 1,
          calfGender,
          calfBirthWeightKg: calfWeight ? Number(calfWeight) : undefined,
          assistanceRequired: false,
          notes: notes || undefined,
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Breeding data synchronized.",
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
        <Text style={styles.headerTitle}>LOG BREEDING</Text>
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
              placeholderTextColor="#475569"
              onFocus={() => setFocusedInput("date")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {activeTab === "SERVICE" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>METHOD</Text>
                <View style={styles.chipScroll}>
                  {[
                    { id: "ARTIFICIAL_INSEMINATION", lbl: "A.I." },
                    { id: "NATURAL_BREEDING", lbl: "NATURAL" },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.chip,
                        method === m.id && styles.chipActive,
                      ]}
                      onPress={() => setMethod(m.id as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          method === m.id && styles.chipTextActive,
                        ]}
                      >
                        {m.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SIRE IDENTIFIER</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "sire" && styles.inputFocused,
                  ]}
                  value={sire}
                  onChangeText={setSire}
                  placeholder="Enter ID"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("sire")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OPERATOR</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "tech" && styles.inputFocused,
                  ]}
                  value={technician}
                  onChangeText={setTechnician}
                  placeholder="e.g. Dr. Smith"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("tech")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </>
          )}

          {activeTab === "PREGNANCY" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>INSPECTION INTERVAL</Text>
                <View style={styles.chipScroll}>
                  {[
                    { id: "60_DAY_CHECK", lbl: "60 DAY" },
                    { id: "90_DAY_CHECK", lbl: "90 DAY" },
                    { id: "ADDITIONAL_CHECK", lbl: "OTHER" },
                  ].map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        checkType === c.id && styles.chipActive,
                      ]}
                      onPress={() => setCheckType(c.id as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          checkType === c.id && styles.chipTextActive,
                        ]}
                      >
                        {c.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>STATUS</Text>
                <View style={styles.chipScroll}>
                  {[
                    { id: "CONFIRMED", lbl: "POSITIVE" },
                    { id: "NOT_PREGNANT", lbl: "NEGATIVE" },
                    { id: "RECHECK_REQUIRED", lbl: "RE-SCAN" },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.chip,
                        pregStatus === s.id && styles.chipActive,
                      ]}
                      onPress={() => setPregStatus(s.id as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          pregStatus === s.id && styles.chipTextActive,
                        ]}
                      >
                        {s.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {activeTab === "CALVING" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DELIVERY STATUS</Text>
                <View style={styles.chipScroll}>
                  {[
                    { id: "COMPLETED", lbl: "NORMAL" },
                    { id: "COMPLICATED", lbl: "COMPLICATED" },
                    { id: "STILLBIRTH", lbl: "STILLBIRTH" },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.chip,
                        calvingStatus === s.id && styles.chipActive,
                      ]}
                      onPress={() => setCalvingStatus(s.id as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          calvingStatus === s.id && styles.chipTextActive,
                        ]}
                      >
                        {s.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OFFSPRING GENDER</Text>
                <View style={styles.chipScroll}>
                  {["FEMALE", "MALE"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        calfGender === g && styles.chipActive,
                      ]}
                      onPress={() => setCalfGender(g as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          calfGender === g && styles.chipTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WEIGHT (KG)</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "weight" && styles.inputFocused,
                  ]}
                  value={calfWeight}
                  onChangeText={setCalfWeight}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#475569"
                  onFocus={() => setFocusedInput("weight")}
                  onBlur={() => setFocusedInput(null)}
                />
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
            <Text style={styles.submitButtonText}>TRANSMIT DATA</Text>
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
  chipActive: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderColor: "#ec4899",
  },
  chipText: { fontSize: 13, color: "#5d5d5d", fontWeight: "600" },
  chipTextActive: { color: "#ec4899" },
  footer: {
    padding: Spacing.four,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  submitButton: {
    backgroundColor: "#ec4899",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
