import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/stores/useAuthStore";
import { Spacing, Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    padding: Spacing.five,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  email: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  roleBadge: {
    marginTop: Spacing.three,
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: "#4338ca",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionSection: {
    marginTop: Spacing.four,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.four,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.three,
  },
});
