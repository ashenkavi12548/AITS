import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

export interface ActionItem {
  id: string;
  label: string;
  iconName: string;
  iconSet?: "Ionicons" | "MaterialCommunityIcons";
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ActionGridProps {
  actions: ActionItem[];
}

export function ActionGrid({ actions }: ActionGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.actionItem, action.disabled && styles.disabled]}
          onPress={action.onPress}
          disabled={action.disabled}
        >
          <View
            style={[
              styles.iconContainer,
              {
                borderColor: action.disabled ? "#334155" : action.color,
                shadowColor: action.color,
              },
            ]}
          >
            {action.iconSet === "Ionicons" ? (
              <Ionicons
                name={action.iconName as React.ComponentProps<typeof Ionicons>["name"]}
                size={24}
                color={action.disabled ? "#475569" : action.color}
              />
            ) : (
              <MaterialCommunityIcons
                name={action.iconName as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                size={24}
                color={action.disabled ? "#475569" : action.color}
              />
            )}
          </View>
          <Text style={[styles.label, action.disabled && styles.labelDisabled]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  actionItem: {
    width: "28%",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.two,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0d0d0d",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  labelDisabled: {
    color: "#8e8e8e",
  },
});
