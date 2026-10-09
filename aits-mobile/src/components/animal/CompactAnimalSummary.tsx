import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { AnimalItem } from "@/types/animals";
import { Spacing, Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

interface CompactAnimalSummaryProps {
  animal: AnimalItem;
  onPress?: () => void;
}

export function CompactAnimalSummary({
  animal,
  onPress,
}: CompactAnimalSummaryProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/animals/${animal.id}` as never);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        {animal.imageUrl ? (
          <Image source={{ uri: animal.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons
              name="cow"
              size={32}
              color={Colors.dark.primary}
            />
          </View>
        )}
        <View style={styles.details}>
          <Text style={styles.tag}>{animal.animalNumber}</Text>
          <Text style={styles.name}>{animal.name || "UNNAMED SUBJECT"}</Text>
          <Text style={styles.subtext}>
            {animal.breed.toUpperCase()} {"//"}{" "}
            {animal.gender === "FEMALE" ? "FEMALE" : "MALE"}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            animal.status === "ACTIVE"
              ? styles.badgeActive
              : styles.badgeInactive,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              animal.status === "ACTIVE"
                ? styles.badgeTextActive
                : styles.badgeTextInactive,
            ]}
          >
            {animal.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.four,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.four,
  },
  details: {
    flex: 1,
  },
  tag: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0d0d0d",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: "#5d5d5d",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: Spacing.two,
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
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeTextActive: {
    color: Colors.light.primary,
  },
  badgeTextInactive: {
    color: "#5d5d5d",
  },
});
