import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/stores/useAuthStore";
import { Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { traceabilityService } from "@/services/traceability.service";
import { DailyActivity } from "@/types/traceability.types";
import { tasksService, Task, TaskStatus } from "@/services/tasks.service";
import Toast from "react-native-toast-message";

export default function DashboardScreen() {
  const { user, activeFarmId, hasPermissionOnFarm } = useAuthStore();
  const router = useRouter();

  const userRole = user?.role?.toUpperCase();
  const farmRole = user?.farmRole?.toUpperCase();

  const canRegister =
    Boolean(
      activeFarmId ? hasPermissionOnFarm("animal:create", activeFarmId) : false,
    ) ||
    Boolean(
      user?.permissions?.includes("animal:create") ||
      userRole === "FARMER" ||
      userRole === "MANAGER" ||
      userRole === "SYSTEM_ADMIN" ||
      farmRole === "OWNER" ||
      farmRole === "MANAGER",
    );

  const {
    data: tasks,
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["dashboard", "tasks", activeFarmId],
    queryFn: () => {
      if (!activeFarmId) return [];
      return tasksService.getTasks(activeFarmId, user?.id, TaskStatus.PENDING);
    },
    enabled: !!activeFarmId,
  });

  const {
    data: recentActivities,
    isLoading: loadingActivities,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["dashboard", "recentActivities", activeFarmId],
    queryFn: async () => {
      const res = await traceabilityService.getDailyActivities({ limit: 5 });
      return res.data;
    },
    enabled: !!user && !!activeFarmId,
  });

  const onRefresh = useCallback(() => {
    refetchTasks();
    refetchActivities();
  }, [refetchTasks, refetchActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "MILK_PRODUCTION":
        return "cup-water";
      case "HEALTH_CHECK":
        return "medical-bag";
      case "TREATMENT":
        return "pill";
      case "VACCINATION":
        return "needle";
      case "BREEDING":
        return "cow";
      case "INSEMINATION":
        return "test-tube";
      case "PREGNANCY_CHECK":
        return "stethoscope";
      case "FEEDING":
        return "food-apple";
      default:
        return "clipboard-text";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "MILK_PRODUCTION":
        return Colors.light.primary;
      case "HEALTH_CHECK":
        return "#ef4444";
      case "TREATMENT":
        return "#f59e0b";
      case "VACCINATION":
        return "#10b981";
      case "BREEDING":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  const navigateToAnimal = (animalId: string) => {
    router.push(`/animals/${animalId}` as any);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl
          refreshing={loadingTasks && loadingActivities}
          onRefresh={onRefresh}
        />
      }
    >
      <View className="p-4 bg-white border-b border-slate-200">
        <Text className="text-2xl font-bold text-slate-900">
          Welcome, {user?.firstName}!
        </Text>
        <Text className="text-base text-slate-500 mt-1">
          Role: {user?.role}
        </Text>
      </View>

      <View className="p-4">
        {canRegister && (
          <TouchableOpacity
            className="flex-row bg-[#10a37f] py-3.5 rounded-xl items-center justify-center mb-4 shadow-md"
            style={{ shadowColor: "#10a37f", elevation: 4 }}
            onPress={() => router.push("/animals/register" as any)}
          >
            <MaterialCommunityIcons
              name="cow"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-base font-bold">
              + Add New Animal
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-white rounded-xl p-4 items-center shadow-sm border border-slate-200"
          style={{ elevation: 2 }}
          onPress={() => router.push("/(tabs)/scanner" as any)}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={48}
            color={Colors.light.primary}
          />
          <Text className="text-lg font-bold text-slate-900 mt-3">
            Scan Animal QR
          </Text>
          <Text className="text-sm text-slate-500 mt-1 text-center">
            Identify animal and perform actions
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-2 px-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-slate-800">
            Tasks & Upcoming
          </Text>
        </View>

        {loadingTasks ? (
          <ActivityIndicator
            size="small"
            color={Colors.light.primary}
            className="my-4"
          />
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task: Task) => (
            <TouchableOpacity
              key={task.id}
              className="flex-row items-center bg-white p-3 rounded-xl mb-3 shadow-sm border border-slate-100"
              style={{ elevation: 1 }}
              onPress={() => {
                if (task.animalId) {
                  navigateToAnimal(task.animalId);
                }
              }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-red-100">
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={24}
                  color="#ef4444"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 capitalize">
                  {task.title}
                </Text>
                {task.animal && (
                  <Text className="text-sm text-slate-500 mt-0.5">
                    Animal: #{task.animal.animalNumber}
                  </Text>
                )}
                {task.dueDate && (
                  <Text className="text-xs text-slate-400 mt-1">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                className="p-2"
                onPress={async () => {
                  try {
                    await tasksService.completeTask(task.id, activeFarmId!);
                    Toast.show({ type: "success", text1: "Task completed" });
                    refetchTasks();
                  } catch (e) {
                    console.error("Failed to complete task:", e);
                    Toast.show({
                      type: "error",
                      text1: "Failed to complete task",
                    });
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={24}
                  color="#10b981"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View className="p-4 items-center bg-white rounded-xl border border-dashed border-slate-300">
            <Text className="text-slate-500">No upcoming tasks right now.</Text>
          </View>
        )}
      </View>

      <View className="mt-2 px-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-slate-800">
            Recent Activities
          </Text>
        </View>

        {loadingActivities ? (
          <ActivityIndicator
            size="small"
            color={Colors.light.primary}
            className="my-4"
          />
        ) : recentActivities && recentActivities.length > 0 ? (
          recentActivities.map((activity: DailyActivity) => (
            <TouchableOpacity
              key={activity.id}
              className="flex-row items-center bg-white p-3 rounded-xl mb-3 shadow-sm border border-slate-100"
              style={{ elevation: 1 }}
              onPress={() =>
                activity.animalId && navigateToAnimal(activity.animalId)
              }
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor:
                    getActivityColor(activity.activityType) + "20",
                }}
              >
                <MaterialCommunityIcons
                  name={getActivityIcon(activity.activityType) as any}
                  size={24}
                  color={getActivityColor(activity.activityType)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 capitalize">
                  {activity.activityType.replace("_", " ")}
                </Text>
                <Text className="text-sm text-slate-500 mt-0.5">
                  {activity.animalTag
                    ? `Animal: #${activity.animalTag}`
                    : activity.farmName
                      ? `Farm: ${activity.farmName}`
                      : "Activity"}
                  {activity.status === "COMPLETED" ? " ✓" : ""}
                </Text>
                <Text className="text-xs text-slate-400 mt-1">
                  {new Date(activity.activityDate).toLocaleString()}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#cbd5e1"
              />
            </TouchableOpacity>
          ))
        ) : (
          <View className="p-4 items-center bg-white rounded-xl border border-dashed border-slate-300">
            <Text className="text-slate-500">No recent activities found.</Text>
          </View>
        )}
      </View>
      <View className="h-6" />
    </ScrollView>
  );
}
