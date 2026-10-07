import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { productionService } from "@/services/production.service";
import { MilkingSession, MilkQualityStatus } from "@/types/production";
import Toast from "react-native-toast-message";

const SESSION_OPTIONS: { value: MilkingSession; label: string; icon: string }[] = [
  { value: "MORNING", label: "Morning", icon: "weather-sunny" },
  { value: "AFTERNOON", label: "Afternoon", icon: "weather-partly-cloudy" },
  { value: "EVENING", label: "Evening", icon: "weather-night" },
];

const QUALITY_OPTIONS: { value: MilkQualityStatus; label: string; color: string }[] = [
  { value: "ACCEPTED", label: "Accepted", color: "#10b981" },
  { value: "REJECTED", label: "Rejected", color: "#ef4444" },
  { value: "PENDING", label: "Pending", color: "#f59e0b" },
];

function getDefaultSession(): MilkingSession {
  const hour = new Date().getHours();
  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}

export default function AddMilkScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFarmId } = useAuthStore();

  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [selectedAnimalLabel, setSelectedAnimalLabel] = useState("");
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [animalSearch, setAnimalSearch] = useState("");
  const [session, setSession] = useState<MilkingSession>(getDefaultSession());
  const [quantity, setQuantity] = useState("");
  const [quality, setQuality] = useState<MilkQualityStatus>("ACCEPTED");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const { data: animals = [], isLoading: loadingAnimals } = useQuery({
    queryKey: ["milk-animals", activeFarmId],
    queryFn: () => productionService.getAnimals(activeFarmId || undefined),
    enabled: !!activeFarmId,
  });

  const filteredAnimals = useMemo(() => {
    if (!animalSearch.trim()) return animals;
    const search = animalSearch.toLowerCase();
    return animals.filter(
      (a) =>
        a.tag.toLowerCase().includes(search) ||
        a.name.toLowerCase().includes(search),
    );
  }, [animals, animalSearch]);

  const mutation = useMutation({
    mutationFn: () =>
      productionService.createRecord({
        animalId: selectedAnimalId,
        farmId: activeFarmId!,
        date: today,
        session,
        quantityLiters: parseFloat(quantity),
        qualityStatus: quality,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Milk production logged!" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed to log production", text2: err.message });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!selectedAnimalId) {
      Toast.show({ type: "error", text1: "Please select an animal" });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid quantity" });
      return;
    }
    mutation.mutate();
  }, [selectedAnimalId, quantity, mutation]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animal Selector */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Select Animal *
          </Text>
          <TouchableOpacity
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => setShowAnimalPicker(!showAnimalPicker)}
          >
            <Text
              className={`text-base ${selectedAnimalLabel ? "text-slate-900" : "text-slate-400"}`}
            >
              {selectedAnimalLabel || "Tap to select animal"}
            </Text>
            <MaterialCommunityIcons
              name={showAnimalPicker ? "chevron-up" : "chevron-down"}
              size={24}
              color="#64748b"
            />
          </TouchableOpacity>

          {showAnimalPicker && (
            <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <TextInput
                className="px-4 py-3 border-b border-slate-100 text-base text-slate-900"
                placeholder="Search by tag or name..."
                placeholderTextColor="#94a3b8"
                value={animalSearch}
                onChangeText={setAnimalSearch}
              />
              <View style={{ maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled>
                  {loadingAnimals ? (
                    <ActivityIndicator className="my-4" color="#0ea5e9" />
                  ) : filteredAnimals.length === 0 ? (
                    <Text className="text-center text-slate-400 py-4">
                      No animals found
                    </Text>
                  ) : (
                    filteredAnimals.map((animal) => (
                      <TouchableOpacity
                        key={animal.id}
                        className="px-4 py-3 border-b border-slate-50 flex-row items-center"
                        style={{
                          backgroundColor:
                            selectedAnimalId === animal.id
                              ? "#f0f9ff"
                              : "transparent",
                        }}
                        onPress={() => {
                          setSelectedAnimalId(animal.id);
                          setSelectedAnimalLabel(
                            `${animal.tag} — ${animal.name}`,
                          );
                          setShowAnimalPicker(false);
                          setAnimalSearch("");
                        }}
                      >
                        <MaterialCommunityIcons
                          name="cow"
                          size={20}
                          color="#0ea5e9"
                          style={{ marginRight: 10 }}
                        />
                        <View>
                          <Text className="text-base font-semibold text-slate-900">
                            {animal.tag}
                          </Text>
                          <Text className="text-sm text-slate-500">
                            {animal.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Session Selector */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Milking Session
          </Text>
          <View className="flex-row gap-2">
            {SESSION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{
                  backgroundColor:
                    session === opt.value ? "#0ea5e9" : "#fff",
                  borderWidth: 1,
                  borderColor:
                    session === opt.value ? "#0ea5e9" : "#e2e8f0",
                }}
                onPress={() => setSession(opt.value)}
              >
                <MaterialCommunityIcons
                  name={opt.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                  size={20}
                  color={session === opt.value ? "#fff" : "#64748b"}
                />
                <Text
                  className="text-xs font-bold mt-1"
                  style={{
                    color: session === opt.value ? "#fff" : "#64748b",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity Input */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Quantity (Liters) *
          </Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            <TextInput
              className="flex-1 px-4 py-4 text-2xl font-bold text-slate-900 text-center"
              placeholder="0.0"
              placeholderTextColor="#94a3b8"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <View className="px-4 py-4 bg-slate-100">
              <Text className="text-base font-bold text-slate-500">L</Text>
            </View>
          </View>
        </View>

        {/* Quality Status */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Milk Quality
          </Text>
          <View className="flex-row gap-2">
            {QUALITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    quality === opt.value ? opt.color : "#fff",
                  borderWidth: 1,
                  borderColor:
                    quality === opt.value ? opt.color : "#e2e8f0",
                }}
                onPress={() => setQuality(opt.value)}
              >
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: quality === opt.value ? "#fff" : opt.color,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Notes
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
            placeholder="Optional observations..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            style={{ minHeight: 60 }}
          />
        </View>

        {/* Date badge */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
            <MaterialCommunityIcons name="calendar" size={20} color="#64748b" />
            <Text className="text-sm text-slate-600 ml-2">
              Recording for: <Text className="font-bold">{today}</Text>
            </Text>
          </View>
        </View>

        {/* Submit */}
        <View className="px-4 pt-6">
          <TouchableOpacity
            className="rounded-xl py-4 items-center justify-center"
            style={{
              backgroundColor: "#0ea5e9",
              opacity: mutation.isPending ? 0.7 : 1,
              elevation: 4,
              shadowColor: "#0ea5e9",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={handleSubmit}
            disabled={mutation.isPending}
            activeOpacity={0.85}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-lg font-bold">
                  Log Production
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
