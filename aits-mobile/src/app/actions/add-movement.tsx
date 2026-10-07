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
import { traceabilityService } from "@/services/traceability.service";
import { MovementReason } from "@/types/traceability.types";
import Toast from "react-native-toast-message";

const REASON_OPTIONS: { value: MovementReason; label: string; icon: string }[] = [
  { value: "PERMANENT_TRANSFER", label: "Permanent Transfer", icon: "swap-horizontal-bold" },
  { value: "TEMPORARY_TRANSFER", label: "Temporary Transfer", icon: "swap-horizontal" },
  { value: "SALE_OR_MARKET", label: "Sale / Market", icon: "cash-multiple" },
  { value: "VETERINARY_VISIT", label: "Veterinary Visit", icon: "medical-bag" },
  { value: "BREEDING_PURPOSE", label: "Breeding Purpose", icon: "cow" },
  { value: "GRAZING", label: "Grazing", icon: "grass" },
];

export default function AddMovementScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFarmId } = useAuthStore();

  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [selectedAnimalLabel, setSelectedAnimalLabel] = useState("");
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [animalSearch, setAnimalSearch] = useState("");

  const [reason, setReason] = useState<MovementReason>("PERMANENT_TRANSFER");

  const [selectedToFarmId, setSelectedToFarmId] = useState("");
  const [selectedToFarmLabel, setSelectedToFarmLabel] = useState("");
  const [showFarmPicker, setShowFarmPicker] = useState(false);

  const [departureTime, setDepartureTime] = useState("08:00");
  const [expectedArrivalTime, setExpectedArrivalTime] = useState("12:00");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const { data: animals = [], isLoading: loadingAnimals } = useQuery({
    queryKey: ["movement-animals", activeFarmId],
    queryFn: () =>
      traceabilityService.getEligibleAnimals(activeFarmId || undefined),
    enabled: !!activeFarmId,
  });

  const { data: farms = [] } = useQuery({
    queryKey: ["active-farms"],
    queryFn: () => traceabilityService.getActiveFarms(),
  });

  const filteredAnimals = useMemo(() => {
    if (!animalSearch.trim()) return animals;
    const s = animalSearch.toLowerCase();
    return animals.filter(
      (a) =>
        a.tagNumber.toLowerCase().includes(s) ||
        a.name.toLowerCase().includes(s),
    );
  }, [animals, animalSearch]);

  const destinationFarms = useMemo(
    () => farms.filter((f) => f.id !== activeFarmId),
    [farms, activeFarmId],
  );

  const mutation = useMutation({
    mutationFn: () =>
      traceabilityService.createFarmMovement({
        animalId: selectedAnimalId,
        fromFarmId: activeFarmId!,
        toFarmId: selectedToFarmId,
        departureDate: today,
        departureTime,
        expectedArrivalDate: today,
        expectedArrivalTime: expectedArrivalTime,
        reason,
        vehicleNumber: vehicleNumber.trim() || undefined,
        driverName: driverName.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Movement recorded!" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed to record movement", text2: err.message });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!selectedAnimalId) {
      Toast.show({ type: "error", text1: "Please select an animal" });
      return;
    }
    if (!selectedToFarmId) {
      Toast.show({ type: "error", text1: "Please select a destination farm" });
      return;
    }
    mutation.mutate();
  }, [selectedAnimalId, selectedToFarmId, mutation]);

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
                    <ActivityIndicator className="my-4" color="#f59e0b" />
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
                              ? "#fffbeb"
                              : "transparent",
                        }}
                        onPress={() => {
                          setSelectedAnimalId(animal.id);
                          setSelectedAnimalLabel(
                            `${animal.tagNumber} — ${animal.name}`,
                          );
                          setShowAnimalPicker(false);
                          setAnimalSearch("");
                        }}
                      >
                        <MaterialCommunityIcons
                          name="cow"
                          size={20}
                          color="#f59e0b"
                          style={{ marginRight: 10 }}
                        />
                        <View>
                          <Text className="text-base font-semibold text-slate-900">
                            {animal.tagNumber}
                          </Text>
                          <Text className="text-sm text-slate-500">
                            {animal.name} • {animal.breed}
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

        {/* Movement Reason */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Movement Reason
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {REASON_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className="py-2.5 px-3 rounded-xl flex-row items-center"
                style={{
                  backgroundColor:
                    reason === opt.value ? "#f59e0b" : "#fff",
                  borderWidth: 1,
                  borderColor:
                    reason === opt.value ? "#f59e0b" : "#e2e8f0",
                }}
                onPress={() => setReason(opt.value)}
              >
                <MaterialCommunityIcons
                  name={opt.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                  size={16}
                  color={reason === opt.value ? "#fff" : "#64748b"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: reason === opt.value ? "#fff" : "#64748b",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Destination Farm */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Destination Farm *
          </Text>
          <TouchableOpacity
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => setShowFarmPicker(!showFarmPicker)}
          >
            <Text
              className={`text-base ${selectedToFarmLabel ? "text-slate-900" : "text-slate-400"}`}
            >
              {selectedToFarmLabel || "Select destination"}
            </Text>
            <MaterialCommunityIcons
              name={showFarmPicker ? "chevron-up" : "chevron-down"}
              size={24}
              color="#64748b"
            />
          </TouchableOpacity>

          {showFarmPicker && (
            <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <View style={{ maxHeight: 160 }}>
                <ScrollView nestedScrollEnabled>
                  {destinationFarms.length === 0 ? (
                    <Text className="text-center text-slate-400 py-4">
                      No other farms available
                    </Text>
                  ) : (
                    destinationFarms.map((farm) => (
                      <TouchableOpacity
                        key={farm.id}
                        className="px-4 py-3 border-b border-slate-50 flex-row items-center"
                        onPress={() => {
                          setSelectedToFarmId(farm.id);
                          setSelectedToFarmLabel(farm.name);
                          setShowFarmPicker(false);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="barn"
                          size={20}
                          color="#f59e0b"
                          style={{ marginRight: 10 }}
                        />
                        <Text className="text-base text-slate-900">
                          {farm.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Times */}
        <View className="flex-row px-4 pt-4 gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Departure Time
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 text-center"
              value={departureTime}
              onChangeText={setDepartureTime}
              placeholder="HH:mm"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Expected Arrival
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 text-center"
              value={expectedArrivalTime}
              onChangeText={setExpectedArrivalTime}
              placeholder="HH:mm"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Transport Details */}
        <View className="flex-row px-4 pt-4 gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Vehicle No.
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Driver Name
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
              value={driverName}
              onChangeText={setDriverName}
            />
          </View>
        </View>

        {/* Notes */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Notes
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
            placeholder="Additional details..."
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
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color="#64748b"
            />
            <Text className="text-sm text-slate-600 ml-2">
              Movement date: <Text className="font-bold">{today}</Text>
            </Text>
          </View>
        </View>

        {/* Submit */}
        <View className="px-4 pt-6">
          <TouchableOpacity
            className="rounded-xl py-4 items-center justify-center"
            style={{
              backgroundColor: "#f59e0b",
              opacity: mutation.isPending ? 0.7 : 1,
              elevation: 4,
              shadowColor: "#f59e0b",
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
                  Record Movement
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
