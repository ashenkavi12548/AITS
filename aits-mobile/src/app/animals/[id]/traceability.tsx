import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { animalsService } from "@/services/animals.service";
import { Spacing } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AnimalTraceabilityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["animalHistory", id],
    queryFn: () => animalsService.getAnimalHistory(id as string),
    enabled: !!id,
  });

  const getIcon = (action: string) => {
    switch (action) {
      case "REGISTERED":
        return "plus-circle";
      case "TRANSFER":
        return "truck";
      case "STATUS_CHANGE":
        return "sync";
      case "QR_REPLACED":
        return "qrcode";
      default:
        return "history";
    }
  };

  const renderItem = ({ item, index }: { item: import("@/types/animals").AnimalHistoryItem; index: number }) => {
    const isLast = index === (data?.length || 0) - 1;

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineColumn}>
          <View style={styles.timelineIcon}>
            <MaterialCommunityIcons
              name={getIcon(item.action)}
              size={16}
              color="#fff"
            />
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.card}>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.action}>{item.action.replace(/_/g, " ")}</Text>
          {item.user && (
            <Text style={styles.user}>
              By: {item.user.name}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: Spacing.four,
            paddingTop: Spacing.four,
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No traceability history found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    backgroundColor: "#f9f9f9",
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineColumn: {
    alignItems: "center",
    width: 32,
    marginRight: Spacing.three,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10a37f",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e5e5",
    marginTop: -16,
    marginBottom: -8,
    zIndex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  date: {
    fontSize: 13,
    color: "#5d5d5d",
    marginBottom: 4,
  },
  action: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0d0d0d",
  },
  notes: {
    fontSize: 14,
    color: "#5d5d5d",
    marginTop: 4,
  },
  user: {
    fontSize: 12,
    color: "#8e8e8e",
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    color: "#5d5d5d",
    marginTop: Spacing.four,
  },
});
