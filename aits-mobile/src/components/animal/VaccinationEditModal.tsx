import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";
import { healthService } from "@/services/health.service";

export interface VaccinationRecord {
  id: string;
  disease?: { name: string };
  vaccineName?: string;
  dose?: string;
  administeredDate?: string;
  vaccinationDate?: string;
  nextDueDate?: string;
  status?: string;
}

interface VaccinationEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vaccination: VaccinationRecord | null;
  animalNumber: string;
}

export const VaccinationEditModal = ({
  visible,
  onClose,
  onSuccess,
  vaccination,
  animalNumber,
}: VaccinationEditModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaccineName, setVaccineName] = useState("");
  const [dose, setDose] = useState("");
  const [date, setDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [status, setStatus] = useState("COMPLETED");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vaccination && visible) {
      setTimeout(() => {
        setVaccineName(
          vaccination.disease?.name || vaccination.vaccineName || "",
        );
        setDose(vaccination.dose || "");
        setDate(
          vaccination.administeredDate
            ? vaccination.administeredDate.split("T")[0]
            : vaccination.vaccinationDate
              ? vaccination.vaccinationDate.split("T")[0]
              : "",
        );
        setNextDueDate(
          vaccination.nextDueDate ? vaccination.nextDueDate.split("T")[0] : "",
        );
        setStatus(vaccination.status || "COMPLETED");
        setError(null);
      }, 0);
    }
  }, [vaccination, visible]);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (!vaccination?.id) throw new Error("Vaccination ID missing");

      await healthService.updateVaccination(vaccination.id, {
        vaccineName,
        dose,
        nextDueDate: nextDueDate || undefined,
        status,
      } as never);

      Alert.alert("Success", "Vaccination record updated successfully.", [
        {
          text: "OK",
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
      let msg = "Failed to update vaccination";
      if (err instanceof Error) {
        msg = err.message;
      }
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      if (axiosErr.response?.data?.message) {
        const dataMsg = axiosErr.response.data.message;
        msg = Array.isArray(dataMsg) ? dataMsg.join(", ") : dataMsg;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="needle"
                  size={20}
                  color={Colors.dark.secondary}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Edit Vaccination</Text>
                <Text style={styles.headerSubtitle}>#{animalNumber}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#5d5d5d" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={styles.scrollContent}
          >
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DATE (Immutable)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={date}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>VACCINE NAME</Text>
              <TextInput
                style={styles.input}
                value={vaccineName}
                onChangeText={setVaccineName}
                placeholder="Vaccine name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DOSAGE</Text>
              <TextInput
                style={styles.input}
                value={dose}
                onChangeText={setDose}
                placeholder="Dosage"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NEXT BOOSTER DUE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={nextDueDate}
                onChangeText={setNextDueDate}
                placeholder="e.g. 2025-01-01"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>STATUS</Text>
              <View style={styles.statusContainer}>
                {["COMPLETED", "SCHEDULED", "CANCELLED"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      status === s && styles.statusOptionActive,
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        status === s && styles.statusTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0d0d0d",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#5d5d5d",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
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
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: Spacing.four,
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5d5d5d",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0d0d0d",
  },
  inputDisabled: {
    backgroundColor: "#f4f4f4",
    color: "#9ca3af",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f9f9f9",
  },
  statusOptionActive: {
    borderColor: Colors.dark.secondary,
    backgroundColor: "#fef2f2",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5d5d5d",
  },
  statusTextActive: {
    color: Colors.dark.secondary,
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f4",
    backgroundColor: "#fff",
    gap: Spacing.three,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  cancelBtnText: {
    color: "#5d5d5d",
    fontSize: 15,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.dark.secondary,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
