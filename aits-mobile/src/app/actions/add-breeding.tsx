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
import { breedingService } from "@/services/breeding.service";
import { BreedingMethod } from "@/types/breeding";
import Toast from "react-native-toast-message";

export default function AddBreedingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFarmId, user } = useAuthStore();

  const [method, setMethod] = useState<BreedingMethod>(
    "ARTIFICIAL_INSEMINATION",
  );
  const [selectedFemaleId, setSelectedFemaleId] = useState("");
  const [selectedFemaleLabel, setSelectedFemaleLabel] = useState("");
  const [showFemalePicker, setShowFemalePicker] = useState(false);
  const [femaleSearch, setFemaleSearch] = useState("");

  const [selectedBullId, setSelectedBullId] = useState("");
  const [selectedBullLabel, setSelectedBullLabel] = useState("");
  const [showBullPicker, setShowBullPicker] = useState(false);

  const [selectedSemenId, setSelectedSemenId] = useState("");
  const [selectedSemenLabel, setSelectedSemenLabel] = useState("");
  const [showSemenPicker, setShowSemenPicker] = useState(false);

  const [attemptNumber, setAttemptNumber] = useState("1");
  const [technician, setTechnician] = useState(
    user ? `${user.firstName} ${user.lastName}` : "",
  );
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const { data: females = [], isLoading: loadingFemales } = useQuery({
    queryKey: ["breeding-females", activeFarmId],
    queryFn: () =>
      breedingService.getEligibleFemaleAnimals(activeFarmId || undefined),
    enabled: !!activeFarmId,
  });

  const { data: bulls = [] } = useQuery({
    queryKey: ["breeding-bulls", activeFarmId],
    queryFn: () => breedingService.getAvailableBulls(activeFarmId || undefined),
    enabled: !!activeFarmId && method === "NATURAL_BREEDING",
  });

  const { data: semenStraws = [] } = useQuery({
    queryKey: ["semen-inventory"],
    queryFn: () => breedingService.getSemenInventory(),
    enabled: method === "ARTIFICIAL_INSEMINATION",
  });

  const filteredFemales = useMemo(() => {
    if (!femaleSearch.trim()) return females;
    const s = femaleSearch.toLowerCase();
    return females.filter(
      (f) =>
        f.tag.toLowerCase().includes(s) || f.name.toLowerCase().includes(s),
    );
  }, [females, femaleSearch]);

  const mutation = useMutation({
    mutationFn: () =>
      breedingService.createBreedingRecord({
        femaleAnimalId: selectedFemaleId,
        farmId: activeFarmId!,
        serviceDate: today,
        serviceMethod: method,
        attemptNumber: parseInt(attemptNumber, 10) || 1,
        technician: technician.trim(),
        notes: notes.trim() || undefined,
        ...(method === "ARTIFICIAL_INSEMINATION"
          ? { semenStrawId: selectedSemenId || undefined }
          : { bullId: selectedBullId || undefined }),
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Breeding record created!" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to record breeding",
        text2: err.message,
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!selectedFemaleId) {
      Toast.show({ type: "error", text1: "Please select a female animal" });
      return;
    }
    if (!technician.trim()) {
      Toast.show({ type: "error", text1: "Technician name is required" });
      return;
    }
    mutation.mutate();
  }, [selectedFemaleId, technician, mutation]);

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
        {/* Method Selector */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Breeding Method
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center"
              style={{
                backgroundColor:
                  method === "ARTIFICIAL_INSEMINATION" ? "#8b5cf6" : "#fff",
                borderWidth: 1,
                borderColor:
                  method === "ARTIFICIAL_INSEMINATION" ? "#8b5cf6" : "#e2e8f0",
              }}
              onPress={() => setMethod("ARTIFICIAL_INSEMINATION")}
            >
              <MaterialCommunityIcons
                name="test-tube"
                size={24}
                color={
                  method === "ARTIFICIAL_INSEMINATION" ? "#fff" : "#8b5cf6"
                }
              />
              <Text
                className="text-sm font-bold mt-1"
                style={{
                  color:
                    method === "ARTIFICIAL_INSEMINATION" ? "#fff" : "#8b5cf6",
                }}
              >
                Artificial (AI)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center"
              style={{
                backgroundColor:
                  method === "NATURAL_BREEDING" ? "#8b5cf6" : "#fff",
                borderWidth: 1,
                borderColor:
                  method === "NATURAL_BREEDING" ? "#8b5cf6" : "#e2e8f0",
              }}
              onPress={() => setMethod("NATURAL_BREEDING")}
            >
              <MaterialCommunityIcons
                name="cow"
                size={24}
                color={method === "NATURAL_BREEDING" ? "#fff" : "#8b5cf6"}
              />
              <Text
                className="text-sm font-bold mt-1"
                style={{
                  color: method === "NATURAL_BREEDING" ? "#fff" : "#8b5cf6",
                }}
              >
                Natural
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Female Animal Selector */}
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-slate-600 mb-2">
            Female Animal *
          </Text>
          <TouchableOpacity
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => setShowFemalePicker(!showFemalePicker)}
          >
            <Text
              className={`text-base ${selectedFemaleLabel ? "text-slate-900" : "text-slate-400"}`}
            >
              {selectedFemaleLabel || "Tap to select female"}
            </Text>
            <MaterialCommunityIcons
              name={showFemalePicker ? "chevron-up" : "chevron-down"}
              size={24}
              color="#64748b"
            />
          </TouchableOpacity>

          {showFemalePicker && (
            <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <TextInput
                className="px-4 py-3 border-b border-slate-100 text-base text-slate-900"
                placeholder="Search by tag or name..."
                placeholderTextColor="#94a3b8"
                value={femaleSearch}
                onChangeText={setFemaleSearch}
              />
              <View style={{ maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled>
                  {loadingFemales ? (
                    <ActivityIndicator className="my-4" color="#8b5cf6" />
                  ) : filteredFemales.length === 0 ? (
                    <Text className="text-center text-slate-400 py-4">
                      No eligible females found
                    </Text>
                  ) : (
                    filteredFemales.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        className="px-4 py-3 border-b border-slate-50"
                        style={{
                          backgroundColor:
                            selectedFemaleId === f.id
                              ? "#f5f3ff"
                              : "transparent",
                        }}
                        onPress={() => {
                          setSelectedFemaleId(f.id);
                          setSelectedFemaleLabel(
                            `${f.tag} — ${f.name} (${f.breed})`,
                          );
                          setShowFemalePicker(false);
                          setFemaleSearch("");
                        }}
                      >
                        <Text className="text-base font-semibold text-slate-900">
                          {f.tag}
                        </Text>
                        <Text className="text-sm text-slate-500">
                          {f.name} • {f.breed} • {f.reproductiveStatus}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Semen Straw (AI) or Bull (Natural) */}
        {method === "ARTIFICIAL_INSEMINATION" ? (
          <View className="px-4 pt-4">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Semen Straw
            </Text>
            <TouchableOpacity
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
              onPress={() => setShowSemenPicker(!showSemenPicker)}
            >
              <Text
                className={`text-base ${selectedSemenLabel ? "text-slate-900" : "text-slate-400"}`}
              >
                {selectedSemenLabel || "Select semen straw (optional)"}
              </Text>
              <MaterialCommunityIcons
                name={showSemenPicker ? "chevron-up" : "chevron-down"}
                size={24}
                color="#64748b"
              />
            </TouchableOpacity>

            {showSemenPicker && (
              <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <View style={{ maxHeight: 160 }}>
                  <ScrollView nestedScrollEnabled>
                    {semenStraws.length === 0 ? (
                      <Text className="text-center text-slate-400 py-4">
                        No semen straws available
                      </Text>
                    ) : (
                      semenStraws.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          className="px-4 py-3 border-b border-slate-50"
                          onPress={() => {
                            setSelectedSemenId(s.id);
                            setSelectedSemenLabel(
                              `${s.bullName} — ${s.bullBreed} (Batch: ${s.batchNumber})`,
                            );
                            setShowSemenPicker(false);
                          }}
                        >
                          <Text className="text-base font-semibold text-slate-900">
                            {s.bullName} ({s.bullBreed})
                          </Text>
                          <Text className="text-sm text-slate-500">
                            Batch: {s.batchNumber} • Qty: {s.quantityAvailable}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="px-4 pt-4">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Bull
            </Text>
            <TouchableOpacity
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
              onPress={() => setShowBullPicker(!showBullPicker)}
            >
              <Text
                className={`text-base ${selectedBullLabel ? "text-slate-900" : "text-slate-400"}`}
              >
                {selectedBullLabel || "Select bull (optional)"}
              </Text>
              <MaterialCommunityIcons
                name={showBullPicker ? "chevron-up" : "chevron-down"}
                size={24}
                color="#64748b"
              />
            </TouchableOpacity>

            {showBullPicker && (
              <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <View style={{ maxHeight: 160 }}>
                  <ScrollView nestedScrollEnabled>
                    {bulls.length === 0 ? (
                      <Text className="text-center text-slate-400 py-4">
                        No bulls available
                      </Text>
                    ) : (
                      bulls.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          className="px-4 py-3 border-b border-slate-50"
                          onPress={() => {
                            setSelectedBullId(b.id);
                            setSelectedBullLabel(
                              `${b.tag} — ${b.name} (${b.breed})`,
                            );
                            setShowBullPicker(false);
                          }}
                        >
                          <Text className="text-base font-semibold text-slate-900">
                            {b.tag} — {b.name}
                          </Text>
                          <Text className="text-sm text-slate-500">
                            {b.breed}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Attempt Number + Technician */}
        <View className="flex-row px-4 pt-4 gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Attempt #
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 text-center"
              value={attemptNumber}
              onChangeText={setAttemptNumber}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-2">
            <Text className="text-sm font-semibold text-slate-600 mb-2">
              Technician / Vet *
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900"
              placeholder="Technician name"
              placeholderTextColor="#94a3b8"
              value={technician}
              onChangeText={setTechnician}
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
            placeholder="Additional observations..."
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
              Service date: <Text className="font-bold">{today}</Text>
            </Text>
          </View>
        </View>

        {/* Submit */}
        <View className="px-4 pt-6">
          <TouchableOpacity
            className="rounded-xl py-4 items-center justify-center"
            style={{
              backgroundColor: "#8b5cf6",
              opacity: mutation.isPending ? 0.7 : 1,
              elevation: 4,
              shadowColor: "#8b5cf6",
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
                  Record Breeding
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
