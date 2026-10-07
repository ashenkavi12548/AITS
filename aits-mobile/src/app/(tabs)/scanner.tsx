import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { Colors } from "@/constants/theme";
import { animalsService } from "@/services/animals.service";
import { useAnimalTagSearch } from "@/hooks/useAnimalTagSearch";
import type { AnimalItem } from "@/types/animals";
import { CompactAnimalSummary } from "@/components/animal/CompactAnimalSummary";
import { ActionGrid, ActionItem } from "@/components/ui/ActionGrid";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    query,
    setQuery,
    results,
    isLoading,
    error: searchError,
    clearResults,
  } = useAnimalTagSearch(300);
  const [isFocused, setIsFocused] = useState(false);

  // Overlay state
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const { activeFarmId, hasPermissionOnFarm, user } = useAuthStore();

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

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setIsProcessing(false);
      setError(null);
      clearResults();
      setSelectedAnimal(null);
      setShowOverlay(false);
    }, [clearResults]),
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-white">
        <Ionicons
          name="camera-outline"
          size={64}
          color={Colors.light.primary}
          className="mb-4"
        />
        <Text className="text-center pb-6 text-[15px] text-[#5d5d5d]">
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          className="px-6 py-3.5 rounded-xl"
          style={{ backgroundColor: Colors.light.primary }}
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold text-[15px]">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openActionOverlay = (animal: AnimalItem) => {
    setSelectedAnimal(animal);
    setShowOverlay(true);
    setIsProcessing(false);
    setQuery("");
    clearResults();
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setSelectedAnimal(null);
    setScanned(false);
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isProcessing || showOverlay) return;
    setScanned(true);
    setIsProcessing(true);
    setError(null);

    try {
      let identifier = data.trim();

      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.id) {
          identifier = parsed.id;
        } else if (parsed && parsed.animalId) {
          identifier = parsed.animalId;
        } else if (parsed && parsed.tagNumber) {
          identifier = parsed.tagNumber;
        }
      } catch {}

      let animalId = identifier;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(identifier)) {
        const res = await animalsService.getAnimals({
          search: identifier,
          limit: 1,
        });
        if (res.data && res.data.length > 0) {
          animalId = res.data[0].id;
        } else {
          throw new Error("Animal not found");
        }
      }

      const response = await animalsService.getAnimalById(animalId);
      openActionOverlay(response);
    } catch (err: any) {
      setError(err.message || "Invalid QR Code");
      setIsProcessing(false);
    }
  };

  const handleSelectAnimal = (animal: AnimalItem) => {
    Keyboard.dismiss();
    setQuery("");
    router.push(`/animals/${animal.id}` as any);
  };

  const getActionsForAnimal = (animal: AnimalItem): ActionItem[] => {
    return [
      {
        id: "milk",
        label: "Log Milk",
        iconName: "water-outline",
        iconSet: "Ionicons",
        color: Colors.light.primary,
        onPress: () => {
          closeOverlay();
          router.push(`/animals/${animal.id}/log-milk` as any);
        },
        disabled: animal.gender === "MALE",
      },
      {
        id: "health",
        label: "Health",
        iconName: "medical-bag",
        iconSet: "MaterialCommunityIcons",
        color: Colors.light.primary,
        onPress: () => {
          closeOverlay();
          router.push(`/animals/${animal.id}/log-health` as any);
        },
      },
      {
        id: "breeding",
        label: "Breeding",
        iconName: "heart-pulse",
        iconSet: "MaterialCommunityIcons",
        color: Colors.light.primary,
        onPress: () => {
          closeOverlay();
          router.push(`/animals/${animal.id}/log-breeding` as any);
        },
      },
      {
        id: "movement",
        label: "Transfer",
        iconName: "truck-outline",
        iconSet: "MaterialCommunityIcons",
        color: Colors.light.primary,
        onPress: () => {
          closeOverlay();
          router.push(`/animals/${animal.id}/log-movement` as any);
        },
      },
      {
        id: "profile",
        label: "Profile",
        iconName: "account-details",
        iconSet: "MaterialCommunityIcons",
        color: Colors.light.primary,
        onPress: () => {
          closeOverlay();
          router.push(`/animals/${animal.id}` as any);
        },
      },
    ];
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        className="flex-1"
        onBarcodeScanned={
          scanned || showOverlay ? undefined : handleBarCodeScanned
        }
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View className="absolute inset-0" pointerEvents="box-none">
        <View
          className="flex-1 justify-center items-center bg-black/40"
          pointerEvents="none"
        >
          <View className="w-65 h-65 border-2 border-white bg-transparent rounded-2xl" />
        </View>

        {canRegister && (
          <View
            className="absolute right-4 z-20 items-end"
            style={{ top: Platform.OS === "ios" ? 60 : 40 }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              className="flex-row items-center bg-[#10a37f] px-3 py-2 rounded-full shadow-md"
              style={{ elevation: 4 }}
              onPress={() => router.push("/animals/register" as any)}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text className="text-white font-bold ml-1 text-sm">
                Register
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute left-4 right-4 z-10"
          style={{ top: Platform.OS === "ios" ? 110 : 90 }}
          pointerEvents="box-none"
        >
          <View
            className={`flex-row items-center bg-white rounded-xl border px-4 h-13 shadow-sm ${isFocused ? "border-blue-500 shadow-blue-500/10" : "border-[#e5e5e5]"}`}
            style={isFocused ? { borderColor: Colors.light.primary } : {}}
          >
            <Ionicons
              name="search"
              size={20}
              color={isFocused ? Colors.light.primary : "#5d5d5d"}
              className="mr-2.5"
            />
            <TextInput
              className="flex-1 text-[15px] text-[#0d0d0d] h-full"
              placeholder="Search animals, ear tags, farms..."
              placeholderTextColor="#5d5d5d"
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} className="p-1">
                <Ionicons name="close-circle" size={20} color="#5d5d5d" />
              </TouchableOpacity>
            )}
          </View>

          {(query.length >= 2 || (isFocused && query.length >= 2)) && (
            <View className="bg-white rounded-xl mt-2 max-h-70 border border-[#e5e5e5] overflow-hidden shadow-lg">
              {isLoading ? (
                <View className="p-8 items-center justify-center">
                  <ActivityIndicator color={Colors.light.primary} />
                </View>
              ) : searchError ? (
                <View className="p-8 items-center justify-center">
                  <Text className="text-red-500 text-sm text-center">
                    {searchError}
                  </Text>
                </View>
              ) : results.length > 0 ? (
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  className="w-full"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="flex-row items-center justify-between p-4 border-b border-[#f4f4f4]"
                      onPress={() => handleSelectAnimal(item)}
                    >
                      <View>
                        <Text className="text-[15px] font-semibold text-[#0d0d0d] mb-1">
                          {item.animalNumber}
                        </Text>
                        {(item.name || item.breed) && (
                          <Text className="text-[13px] text-[#5d5d5d]">
                            {[item.name, item.breed]
                              .filter(Boolean)
                              .join(" • ")}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#e5e5e5"
                      />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View className="p-8 items-center justify-center">
                  <Text className="text-[#5d5d5d] text-sm text-center mb-2">
                    No matching animals found
                  </Text>
                  {canRegister && (
                    <TouchableOpacity
                      className="flex-row items-center bg-[#e6f7f2] px-4 py-2.5 rounded-lg border border-[#10a37f] mt-2"
                      onPress={() => router.push("/animals/register" as any)}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#10a37f"
                      />
                      <Text className="text-[#10a37f] font-bold text-sm ml-2">
                        Register New Animal
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>

        <View className="absolute bottom-10 left-0 right-0 items-center">
          {isProcessing ? (
            <View className="flex-row bg-white px-6 py-3.5 rounded-full items-center shadow-md">
              <ActivityIndicator
                color={Colors.light.primary}
                style={{ marginRight: 12 }}
              />
              <Text className="text-[#0d0d0d] text-sm font-medium">
                Processing...
              </Text>
            </View>
          ) : error ? (
            <View className="bg-white p-5 rounded-2xl items-center w-[90%] shadow-lg shadow-red-500/20">
              <Text className="text-red-500 text-[15px] font-semibold mb-3 text-center">
                {error}
              </Text>
              <TouchableOpacity
                className="bg-[#f4f4f4] px-5 py-2.5 rounded-lg"
                onPress={() => {
                  setError(null);
                  setScanned(false);
                }}
              >
                <Text className="text-[#0d0d0d] font-semibold text-sm">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row bg-white px-6 py-3.5 rounded-full items-center shadow-md">
              <Ionicons
                name="scan"
                size={20}
                color={Colors.light.primary}
                style={{ marginRight: 8 }}
              />
              <Text className="text-[#0d0d0d] text-sm font-medium">
                Scanning for QR Code...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Overlay Modal */}
      <Modal
        visible={showOverlay}
        transparent={true}
        animationType="slide"
        onRequestClose={closeOverlay}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="absolute inset-0 bg-black/40"
            activeOpacity={1}
            onPress={closeOverlay}
          />

          <View
            className="bg-white rounded-t-3xl px-4 pt-2 shadow-2xl"
            style={{
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
              elevation: 20,
            }}
          >
            <View className="w-10 h-1 bg-[#e5e5e5] rounded-full self-center mb-4" />
            <Text className="text-lg font-semibold text-[#0d0d0d] mb-4 text-center">
              Animal Actions
            </Text>

            {selectedAnimal && (
              <>
                <CompactAnimalSummary animal={selectedAnimal} />
                <Text className="text-[13px] font-semibold text-[#5d5d5d] mt-4 mb-3">
                  Select an Action
                </Text>
                <ActionGrid actions={getActionsForAnimal(selectedAnimal)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
