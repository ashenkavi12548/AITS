import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/useAuthStore";

interface ActionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  route: string;
  gradientStart: string;
  gradientEnd: string;
  iconBg: string;
}

const ACTIONS: ActionCard[] = [
  {
    id: "health",
    title: "Health Record",
    subtitle: "Diagnosis, treatment, vaccination",
    icon: "medical-bag",
    route: "/actions/add-health",
    gradientStart: "#10a37f",
    gradientEnd: "#059669",
    iconBg: "rgba(255,255,255,0.2)",
  },
  {
    id: "milk",
    title: "Milk Production",
    subtitle: "Log milking session yield",
    icon: "cup-water",
    route: "/actions/add-milk",
    gradientStart: "#0ea5e9",
    gradientEnd: "#0284c7",
    iconBg: "rgba(255,255,255,0.2)",
  },
  {
    id: "breeding",
    title: "Breeding Record",
    subtitle: "AI or natural breeding event",
    icon: "cow",
    route: "/actions/add-breeding",
    gradientStart: "#8b5cf6",
    gradientEnd: "#7c3aed",
    iconBg: "rgba(255,255,255,0.2)",
  },
  {
    id: "movement",
    title: "Animal Movement",
    subtitle: "Transfer or relocate animals",
    icon: "truck-fast",
    route: "/actions/add-movement",
    gradientStart: "#f59e0b",
    gradientEnd: "#d97706",
    iconBg: "rgba(255,255,255,0.2)",
  },
];

export default function ActionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-900">Quick Actions</Text>
        <Text className="text-base text-slate-500 mt-1">
          Field data collection tools
        </Text>
      </View>

      {/* Action Cards Grid */}
      <View className="px-4 pt-2">
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            className="mb-4 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: action.gradientStart,
              elevation: 6,
              shadowColor: action.gradientStart,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            activeOpacity={0.85}
            onPress={() => router.push(action.route as never)}
          >
            <View className="flex-row items-center p-5">
              {/* Icon circle */}
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: action.iconBg }}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={32}
                  color="#fff"
                />
              </View>

              {/* Text */}
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">
                  {action.title}
                </Text>
                <Text
                  className="text-sm text-white mt-1"
                  style={{ opacity: 0.85 }}
                >
                  {action.subtitle}
                </Text>
              </View>

              {/* Arrow */}
              <MaterialCommunityIcons
                name="chevron-right"
                size={28}
                color="rgba(255,255,255,0.6)"
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Info */}
      <View className="mx-4 mt-2 p-4 rounded-2xl bg-white border border-slate-200">
        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color="#64748b"
          />
          <Text className="text-sm font-semibold text-slate-600 ml-2">
            Field Collection Mode
          </Text>
        </View>
        <Text className="text-sm text-slate-500 leading-5">
          All records sync with the web dashboard instantly. Scan QR codes to
          auto-fill animal tags. Logged in as{" "}
          <Text className="font-semibold text-slate-700">
            {user?.firstName} {user?.lastName}
          </Text>
          .
        </Text>
      </View>

      {/* Spacer for tab bar */}
      <View style={{ height: Platform.OS === "ios" ? 48 : 24 }} />
    </ScrollView>
  );
}
