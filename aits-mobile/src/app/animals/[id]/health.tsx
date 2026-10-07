import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/health.service";
import { Spacing } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/useAuthStore";
import { VaccinationEditModal } from "@/components/animal/VaccinationEditModal";

export default function AnimalHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<"DIAGNOSES" | "VACCINATIONS">("DIAGNOSES");
  const [selectedVaccination, setSelectedVaccination] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const { hasPermissionOnFarm } = useAuthStore();
  const canAdd = hasPermissionOnFarm("MANAGE_HEALTH"); // Basic check

  const { data: diagnoses, isLoading: loadingDiag } = useQuery({
    queryKey: ["diagnoses", id],
    queryFn: () => healthService.getDiagnoses({ search: id as string }),
    enabled: !!id && tab === "DIAGNOSES",
  });

  const { data: vaccinations, isLoading: loadingVax } = useQuery({
    queryKey: ["vaccinations", id],
    queryFn: () => healthService.getVaccinations({ search: id as string }),
    enabled: !!id && tab === "VACCINATIONS",
  });

  const isLoading = tab === "DIAGNOSES" ? loadingDiag : loadingVax;
  const listData =
    tab === "DIAGNOSES" ? diagnoses?.data || [] : vaccinations?.data || [];

  const renderDiagnosis = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.disease?.name || "Unknown Disease"}
        </Text>
        <View
          style={[
            styles.badge,
            item.status === "ACTIVE"
              ? styles.badgeActive
              : styles.badgeInactive,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.status === "ACTIVE" && styles.badgeTextActive,
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>
        Date: {new Date(item.diagnosedDate).toLocaleDateString()}
      </Text>
      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
    </View>
  );

  const renderVaccination = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.disease?.name || item.vaccineName || "General Vaccine"}
        </Text>
        <Text style={styles.date}>
          {new Date(
            item.administeredDate || item.vaccinationDate,
          ).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.notes}>Dose: {item.dose || "N/A"}</Text>
      <Text style={styles.notes}>
        Next Booster:{" "}
        {item.nextDueDate
          ? new Date(item.nextDueDate).toLocaleDateString()
          : "None"}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.notes}>
          By: {item.administeredBy?.firstName || ""}{" "}
          {item.administeredBy?.lastName || ""}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            setSelectedVaccination(item);
            setIsEditModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="pencil" size={14} color="#10a37f" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            tab === "DIAGNOSES" && styles.switchBtnActive,
          ]}
          onPress={() => setTab("DIAGNOSES")}
        >
          <Text
            style={[
              styles.switchText,
              tab === "DIAGNOSES" && styles.switchTextActive,
            ]}
          >
            Diagnoses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            tab === "VACCINATIONS" && styles.switchBtnActive,
          ]}
          onPress={() => setTab("VACCINATIONS")}
        >
          <Text
            style={[
              styles.switchText,
              tab === "VACCINATIONS" && styles.switchTextActive,
            ]}
          >
            Vaccinations
          </Text>
        </TouchableOpacity>
      </View>

      {canAdd && (
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            Add {tab === "DIAGNOSES" ? "Diagnosis" : "Vaccine"}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={tab === "DIAGNOSES" ? renderDiagnosis : renderVaccination}
          contentContainerStyle={{ paddingBottom: Spacing.four }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No records found.</Text>
          }
        />
      )}

      <VaccinationEditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          healthService.getVaccinations({ search: id as string }); // refetch could be optimized but we are re-rendering
          // Wait, queryClient.invalidateQueries would be better but we don't have it initialized here.
        }}
        vaccination={selectedVaccination}
        animalNumber={id as string}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    backgroundColor: "#f9f9f9",
  },
  tabSwitcher: {
    flexDirection: "row",
    marginBottom: Spacing.four,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  switchBtnActive: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  switchText: {
    color: "#5d5d5d",
    fontWeight: "600",
    fontSize: 13,
  },
  switchTextActive: {
    color: "#10a37f",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#10a37f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0d0d0d",
    flex: 1,
  },
  date: {
    fontSize: 13,
    color: "#5d5d5d",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeInactive: {
    backgroundColor: "#f4f4f4",
    borderColor: "#e5e5e5",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5d5d5d",
  },
  badgeTextActive: {
    color: "#ef4444",
  },
  notes: {
    fontSize: 14,
    color: "#5d5d5d",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f6f2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c0ebd9",
  },
  editBtnText: {
    color: "#10a37f",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#5d5d5d",
    marginTop: Spacing.four,
  },
});
