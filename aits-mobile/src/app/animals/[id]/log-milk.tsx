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
import { productionService } from "@/services/production.service";
import { Spacing, Colors } from "@/constants/theme";
import { CompactAnimalSummary } from "@/components/animal/CompactAnimalSummary";
import { RecordTimestamp } from "@/components/common/RecordTimestamp";
import { MilkingSession, MilkQualityStatus } from "@/types/production";

const SessionSelector = ({
  session,
  setSession,
}: {
  session: MilkingSession;
  setSession: (s: MilkingSession) => void;
}) => {
  const sessions: { id: MilkingSession; label: string; icon: string }[] = [
    { id: "MORNING", label: "MORNING", icon: "partly-sunny-outline" },
    { id: "AFTERNOON", label: "AFTERNOON", icon: "sunny-outline" },
    { id: "EVENING", label: "EVENING", icon: "moon-outline" },
  ];
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>MILKING SESSION</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {sessions.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, session === s.id && styles.chipActive]}
            onPress={() => setSession(s.id)}
          >
            <Ionicons
              name={s.icon as any}
              size={16}
              color={session === s.id ? Colors.dark.primary : "#475569"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.chipText,
                session === s.id && styles.chipTextActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const QualitySelector = ({
  quality,
  setQuality,
}: {
  quality: MilkQualityStatus;
  setQuality: (q: MilkQualityStatus) => void;
}) => {
  const qualities: { id: MilkQualityStatus; label: string }[] = [
    { id: "ACCEPTED", label: "ACCEPTED" },
    { id: "PENDING", label: "PENDING" },
    { id: "REJECTED", label: "REJECTED" },
  ];
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>QUALITY STATUS</Text>
      <View style={styles.gridContainer}>
        {qualities.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={[styles.gridChip, quality === q.id && styles.gridChipActive]}
            onPress={() => setQuality(q.id)}
          >
            <Text
              style={[
                styles.gridChipText,
                quality === q.id && styles.chipTextActive,
              ]}
            >
              {q.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function LogMilkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [session, setSession] = useState<MilkingSession>("MORNING");
  const [quantity, setQuantity] = useState("");
  const [quality, setQuality] = useState<MilkQualityStatus>("ACCEPTED");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  if (!animal) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a valid milk quantity in liters.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await productionService.createRecord({
        animalId: animal.id,
        farmId: animal.farmId,
        date,
        session,
        quantityLiters: Number(quantity),
        qualityStatus: quality,
        notes: notes.trim() || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Milk production logged successfully.",
      });
      router.back();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to log milk production.";
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
        <Text style={styles.headerTitle}>LOG PRODUCTION</Text>
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
              name="water-outline"
              size={20}
              color="#0ea5e9"
            />
            <Text style={styles.cardTitle}>PRODUCTION METRICS</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE (YYYY-MM-DD)</Text>
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

          <SessionSelector session={session} setSession={setSession} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>QUANTITY (LITERS)</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === "qty" && styles.inputFocused,
              ]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              onFocus={() => setFocusedInput("qty")}
              onBlur={() => setFocusedInput(null)}
              placeholder="0.0"
              placeholderTextColor="#475569"
            />
          </View>

          <QualitySelector quality={quality} setQuality={setQuality} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OBSERVATIONS / NOTES</Text>
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
            <Text style={styles.submitButtonText}>TRANSMIT RECORD</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
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
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d0d0d",
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
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
    color: "#0ea5e9",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5d5d5d",
    marginBottom: 8,
  },
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  chipScroll: {
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  chipActive: {
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 13,
    color: "#5d5d5d",
    fontWeight: "600",
  },
  chipTextActive: {
    color: Colors.light.primary,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    width: "48%",
    alignItems: "center",
  },
  gridChipActive: {
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    borderColor: Colors.light.primary,
  },
  gridChipText: {
    fontSize: 13,
    color: "#5d5d5d",
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    padding: Spacing.four,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  submitButton: {
    backgroundColor: "#0ea5e9", // Blueish for milk
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
