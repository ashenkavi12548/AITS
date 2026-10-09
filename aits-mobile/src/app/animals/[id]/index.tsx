import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { AnimalDetailResponse } from "@/types/animals";
import { Spacing, Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/useAuthStore";
import { animalsService } from "@/services/animals.service";

export default function AnimalInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();

  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);
  const { hasPermissionOnFarm } = useAuthStore();
  const rfid = animal?.identifiers?.find(
    (i) => i.identifierType === "RFID",
  )?.identifierValue;
  const [isDeleting, setIsDeleting] = useState(false);

  if (!animal) return null;

  const canDelete = hasPermissionOnFarm("DELETE_ANIMAL", animal.farmId);
  const canUpdate = hasPermissionOnFarm("UPDATE_ANIMAL", animal.farmId);

  const handleDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this animal profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await animalsService.deleteAnimal(animal.id);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Animal deleted successfully.",
              });
              router.replace("/(tabs)" as never);
            } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  err.response?.data?.message || "Failed to delete animal.",
              });
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Spacing.six }}
    >
      {/* Header Profile Card */}
      <View style={styles.headerCard}>
        {animal.imageUrl ? (
          <Image source={{ uri: animal.imageUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="cow" size={48} color="#fff" />
          </View>
        )}
        <Text style={styles.name}>{animal.name || "Unnamed"}</Text>
        <Text style={styles.tag}>{animal.animalNumber}</Text>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              animal.status === "ACTIVE"
                ? styles.badgeActive
                : styles.badgeInactive,
            ]}
          >
            <Text style={styles.badgeText}>{animal.status}</Text>
          </View>
          <View style={[styles.badge, styles.badgeNeutral]}>
            <Text style={styles.badgeTextNeutral}>{animal.gender}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {canUpdate && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() =>
                Toast.show({
                  type: "info",
                  text1: "Notice",
                  text2:
                    "Edit functionality is not fully implemented in this preview.",
                })
              }
            >
              <MaterialCommunityIcons name="pencil" size={18} color={Colors.light.primary} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <MaterialCommunityIcons
                  name="delete"
                  size={18}
                  color="#ef4444"
                />
              )}
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* QR Code Section */}
      {animal.activeQr?.qrImageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Identification</Text>
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: animal.activeQr.qrImageUrl }}
              style={styles.qrImage}
            />
            <Text style={styles.qrText}>Scan to quickly access profile</Text>
          </View>
        </View>
      )}

      {/* Identity & Demographics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity & Demographics</Text>
        <DetailRow label="Species" value={animal.species} />
        <DetailRow label="Breed" value={animal.breed} />
        <DetailRow label="Gender" value={animal.gender} />
        <DetailRow
          label="Date of Birth"
          value={
            animal.dateOfBirth
              ? new Date(animal.dateOfBirth).toLocaleDateString()
              : "Unknown"
          }
        />
        {animal.color && <DetailRow label="Coat Color" value={animal.color} />}
        {rfid && <DetailRow label="RFID / Bolus" value={rfid} />}
        {animal.weight && (
          <DetailRow label="Weight (kg)" value={animal.weight.toString()} />
        )}
      </View>

      {/* Origin & Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Origin & Location</Text>
        {animal.farm && (
          <>
            <DetailRow label="Farm Name" value={animal.farm.name} />
            {animal.farm.registrationNumber && (
              <DetailRow
                label="Farm Reg No"
                value={animal.farm.registrationNumber}
              />
            )}
            <DetailRow
              label="Location"
              value={`${animal.farm.city}, ${animal.farm.province}`}
            />
          </>
        )}
      </View>

      {/* Pedigree (Optional) */}
      {(animal.mother || animal.father) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedigree</Text>
          {animal.mother && (
            <DetailRow
              label="Mother (Dam)"
              value={`${animal.mother.animalNumber} ${animal.mother.name ? `(${animal.mother.name})` : ""}`}
            />
          )}
          {animal.father && (
            <DetailRow
              label="Father (Sire)"
              value={`${animal.father.animalNumber} ${animal.father.name ? `(${animal.father.name})` : ""}`}
            />
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/animals/${id}/log-health` as never)}
          >
            <MaterialCommunityIcons
              name="medical-bag"
              size={24}
              color="#ef4444"
            />
            <Text style={styles.quickActionText}>Add Health</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/animals/${id}/health` as never)}
          >
            <MaterialCommunityIcons name="history" size={24} color="#ef4444" />
            <Text style={styles.quickActionText}>Health History</Text>
          </TouchableOpacity>
          {animal.gender === "FEMALE" && (
            <>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push(`/animals/${id}/log-milk` as never)}
              >
                <MaterialCommunityIcons
                  name="cup-water"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.quickActionText}>Add Milk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push(`/animals/${id}/production` as never)}
              >
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.quickActionText}>Production</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push(`/animals/${id}/log-breeding` as never)}
              >
                <MaterialCommunityIcons name="cow" size={24} color="#8b5cf6" />
                <Text style={styles.quickActionText}>Breeding</Text>
              </TouchableOpacity>
            </>
          )}
          {animal.status !== "QUARANTINED" && (
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push(`/animals/${id}/log-movement` as never)}
            >
              <MaterialCommunityIcons
                name="truck-outline"
                size={24}
                color="#f59e0b"
              />
              <Text style={styles.quickActionText}>Movement</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/animals/${id}/traceability` as never)}
          >
            <MaterialCommunityIcons
              name="map-marker-path"
              size={24}
              color="#10b981"
            />
            <Text style={styles.quickActionText}>Traceability</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    backgroundColor: "#f9f9f9",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: Spacing.three,
    borderWidth: 2,
    borderColor: "#e5e5e5",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0d0d0d",
  },
  tag: {
    fontSize: 15,
    color: "#5d5d5d",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.three,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    borderColor: "rgba(16, 163, 127, 0.2)",
  },
  badgeInactive: {
    backgroundColor: "#f4f4f4",
    borderColor: "#e5e5e5",
  },
  badgeNeutral: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderColor: "rgba(14, 165, 233, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10a37f",
  },
  badgeTextNeutral: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0ea5e9",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f4",
    paddingTop: Spacing.four,
    width: "100%",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: "#f4f4f4",
    borderColor: "#e5e5e5",
  },
  editText: {
    color: "#0d0d0d",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  deleteText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0d0d0d",
    marginBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    color: "#5d5d5d",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#0d0d0d",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  qrImage: {
    width: 150,
    height: 150,
    marginBottom: Spacing.two,
  },
  qrText: {
    fontSize: 13,
    color: "#5d5d5d",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    justifyContent: "space-between",
  },
  quickActionBtn: {
    width: "31%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: Spacing.two,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    marginTop: Spacing.one,
    textAlign: "center",
  },
});
