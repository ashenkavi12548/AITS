import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Slot,
  useLocalSearchParams,
  useRouter,
  usePathname,
} from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { animalsService } from "@/services/animals.service";
import { Spacing, Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnimalProfileLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: animal,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => animalsService.getAnimalById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (error || !animal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load animal profile.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs = [
    { name: "Info", path: `/animals/${id}` },
    { name: "Milk", path: `/animals/${id}/production` },
    { name: "Health", path: `/animals/${id}/health` },
    { name: "History", path: `/animals/${id}/traceability` },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)" as any)}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{animal.animalNumber}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.iconButton}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="#0f172a" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => router.replace(tab.path as any)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d0d0d",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#10a37f",
  },
  tabText: {
    fontSize: 14,
    color: "#5d5d5d",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#10a37f",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  backButton: {
    backgroundColor: "#10a37f",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
