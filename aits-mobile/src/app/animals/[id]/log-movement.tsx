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
import { traceabilityService } from "@/services/traceability.service";
import { Spacing, Colors } from "@/constants/theme";
import { CompactAnimalSummary } from "@/components/animal/CompactAnimalSummary";
import { RecordTimestamp } from "@/components/common/RecordTimestamp";
import { MovementReason, MovementStatus } from "@/types/traceability.types";

export default function LogMovementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState<MovementReason>("SALE_OR_MARKET");
  const [toFarmId, setToFarmId] = useState("");
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  useEffect(() => {
    traceabilityService
      .getActiveFarms()
      .then((res) => setFarms(res))
      .catch((err) => console.error("Failed to load farms", err))
      .finally(() => setIsLoadingFarms(false));
  }, []);

  if (!animal) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!toFarmId) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Destination node not selected.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await traceabilityService.createFarmMovement({
        animalId: animal.id,
        fromFarmId: animal.farmId,
        toFarmId,
        reason,
        expectedArrivalDate: date,
        status: "SCHEDULED" as MovementStatus,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Relocation protocol initiated.",
      });
      router.back();
    } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg =
        err.response?.data?.message || err.message || "TRANSFER FAILED";
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
        <Text style={styles.headerTitle}>LOG RELOCATION</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <CompactAnimalSummary animal={animal} />

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
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="truck-fast-outline"
              size={20}
              color="#f59e0b"
            />
            <Text style={styles.cardTitle}>TRANSFER DETAILS</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              BUSINESS EXPECTED ARRIVAL (YYYY-MM-DD)
            </Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>REASON FOR MOVEMENT</Text>
            <View style={styles.chipScroll}>
              {[
                { id: "SALE_OR_MARKET", lbl: "SALE / MARKET" },
                { id: "TEMPORARY_TRANSFER", lbl: "RELOCATION" },
                { id: "VETERINARY_VISIT", lbl: "TREATMENT" },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chip, reason === r.id && styles.chipActive]}
                  onPress={() => setReason(r.id as never)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      reason === r.id && styles.chipTextActive,
                    ]}
                  >
                    {r.lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESTINATION NODE</Text>
            {isLoadingFarms ? (
              <ActivityIndicator
                color="#f59e0b"
                style={{ alignSelf: "flex-start", padding: 8 }}
              />
            ) : (
              <View style={styles.chipScroll}>
                {farms
                  .filter((f) => f.id !== animal.farmId)
                  .map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.chip,
                        toFarmId === f.id && styles.chipActive,
                      ]}
                      onPress={() => setToFarmId(f.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          toFarmId === f.id && styles.chipTextActive,
                        ]}
                      >
                        {f.name.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                {farms.filter((f) => f.id !== animal.farmId).length === 0 && (
                  <Text
                    style={{
                      color: "#475569",
                      fontStyle: "italic",
                      fontSize: 10,
                      letterSpacing: 1,
                    }}
                  >
                    NO ACTIVE NODES AVAILABLE
                  </Text>
                )}
              </View>
            )}
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
            <Text style={styles.submitButtonText}>AUTHORIZE TRANSFER</Text>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
    paddingBottom: Spacing.two,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f59e0b",
    marginLeft: 8,
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
  inputFocused: { borderColor: "#f59e0b", backgroundColor: "#ffffff" },
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
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#f59e0b",
  },
  chipText: { fontSize: 13, color: "#5d5d5d", fontWeight: "600" },
  chipTextActive: { color: "#f59e0b" },
  footer: {
    padding: Spacing.four,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  submitButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
