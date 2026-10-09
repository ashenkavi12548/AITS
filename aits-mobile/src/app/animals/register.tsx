import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { animalsService } from "@/services/animals.service";
import { farmsService, Farm } from "@/services/farms.service";
import { Spacing } from "@/constants/theme";
import type { AnimalGender } from "@/types/animals";

export default function RegisterAnimalScreen() {
  const router = useRouter();

  // Form State
  const [animalNumber, setAnimalNumber] = useState("");
  const [rfidNumber, setRfidNumber] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cattle");
  const [breed, setBreed] = useState("Holstein-Friesian");
  const [gender, setGender] = useState<AnimalGender>("FEMALE");
  const [dateOfBirth, setDateOfBirth] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [farmId, setFarmId] = useState("");
  const [registrationSource, setRegistrationSource] = useState("BORN_ON_FARM");
  const [motherTagOrId, setMotherTagOrId] = useState("");
  const [fatherTagOrId, setFatherTagOrId] = useState("");
  const [notes] = useState("");

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  // Photo state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFarms() {
      try {
        const list = await farmsService.getFarms();
        setFarms(list);
        if (list.length > 0) {
          setFarmId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load farms:", err);
      } finally {
        setIsLoadingFarms(false);
      }
    }
    loadFarms();
  }, []);

  const handleGenerateTag = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setAnimalNumber(`COW-LK-${randomSuffix}`);
  };

  const handleGenerateRfid = () => {
    const rfidDigits = Math.floor(100000000000 + Math.random() * 900000000000);
    setRfidNumber(`982000${rfidDigits.toString().slice(0, 6)}`);
  };

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoPreview(asset.uri);
      setIsUploadingPhoto(true);
      setError(null);

      try {
        // Upload to Cloudinary
        const file = {
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: asset.fileName || "upload.jpg",
        };

        const res = await animalsService.uploadPhoto(file as never);
        if (res.imageUrl) {
          setImageUrl(res.imageUrl);
        }
      } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
        Toast.show({
          type: "error",
          text1: "Upload Error",
          text2: err.message || "Failed to upload photo",
        });
        setPhotoPreview(null);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      await handleImageResult(result);
    } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
      Toast.show({
        type: "error",
        text1: "Gallery Error",
        text2: err.message || "Failed to open gallery",
      });
    }
  };

  const takePhoto = async () => {
    try {
      if (!cameraPermission?.granted) {
        const perm = await requestCameraPermission();
        if (!perm.granted) {
          Toast.show({
            type: "error",
            text1: "Permission Required",
            text2: "Camera access is needed to take a photo of the animal.",
          });
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      await handleImageResult(result);
    } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
      Toast.show({
        type: "error",
        text1: "Camera Error",
        text2: err.message || "Failed to open camera",
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const tagClean = animalNumber.trim().toUpperCase();

    if (!tagClean) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Official Ear Tag Number is required.",
      });
      return;
    }
    if (!farmId) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Assigned Farm Facility is required.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await animalsService.createAnimal({
        animalNumber: tagClean,
        rfidNumber: rfidNumber.trim()
          ? rfidNumber.trim().toUpperCase()
          : undefined,
        name: name.trim() || undefined,
        species,
        breed,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        color: color.trim() || undefined,
        weight: weight !== "" ? Number(weight) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        farmId,
        registrationSource,
        motherTagOrId: motherTagOrId.trim() || undefined,
        fatherTagOrId: fatherTagOrId.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Animal registered successfully!",
      });
      router.replace(`/animals/${response.animal.id}` as never);
    } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please check field values.";
      const errorMsg = Array.isArray(msg) ? msg.join(", ") : msg;
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Livestock</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 1. Official Identification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="tag" size={20} color="#10a37f" />
            <Text style={styles.sectionTitle}>1. Official Identification</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Official Ear Tag Number *</Text>
              <TouchableOpacity onPress={handleGenerateTag}>
                <Text style={styles.generateText}>Generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.monoInput]}
              value={animalNumber}
              onChangeText={setAnimalNumber}
              placeholder="e.g. COW-LK-7813"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>RFID / Bolus Number (Optional)</Text>
              <TouchableOpacity onPress={handleGenerateRfid}>
                <Text style={styles.generateText}>Generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.monoInput]}
              value={rfidNumber}
              onChangeText={setRfidNumber}
              placeholder="e.g. 982000388481"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* 2. Phenotypic */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cow" size={20} color="#10a37f" />
            <Text style={styles.sectionTitle}>2. Physical Characteristics</Text>
          </View>

          <SimpleSelect
            label="Species *"
            value={species}
            onChange={setSpecies}
            options={[
              { label: "Cattle", value: "Cattle" },
              { label: "Buffalo", value: "Buffalo" },
              { label: "Goat", value: "Goat" },
              { label: "Sheep", value: "Sheep" },
            ]}
          />

          <SimpleSelect
            label="Gender *"
            value={gender}
            onChange={(val) => setGender(val as AnimalGender)}
            options={[
              { label: "Female", value: "FEMALE" },
              { label: "Male", value: "MALE" },
            ]}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed *</Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder="e.g. Holstein-Friesian"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name / Nickname</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Daisy"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="e.g. 45"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Coat Color</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholder="e.g. Black & White"
              />
            </View>
          </View>

          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Animal Photograph</Text>
            {photoPreview ? (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: photoPreview }}
                  style={styles.photoPreview}
                />
                <View style={styles.photoOverlay}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator color="#10a37f" size="large" />
                  ) : (
                    <View style={styles.photoActions}>
                      <TouchableOpacity
                        onPress={takePhoto}
                        style={styles.photoBtn}
                      >
                        <Text style={styles.photoBtnText}>Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setPhotoPreview(null);
                          setImageUrl("");
                        }}
                        style={[styles.photoBtn, styles.photoBtnDanger]}
                      >
                        <Text style={styles.photoBtnTextDanger}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.photoUploadRow}>
                <TouchableOpacity style={[styles.uploadBox, { flex: 1, marginRight: 8 }]} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={28} color="#10a37f" />
                  <Text style={styles.uploadText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBox, { flex: 1, marginLeft: 8 }]} onPress={pickImage}>
                  <Ionicons name="image-outline" size={28} color="#64748b" />
                  <Text style={[styles.uploadText, { color: "#64748b" }]}>Library</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.helperText}>Used for identification and certificates.</Text>
          </View>
        </View>

        {/* 3. Origin & Farm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#10a37f" />
            <Text style={styles.sectionTitle}>3. Origin & Location</Text>
          </View>

          <SimpleSelect
            label="Registration Source *"
            value={registrationSource}
            onChange={setRegistrationSource}
            options={[
              { label: "Born on Farm", value: "BORN_ON_FARM" },
              { label: "Purchased", value: "PURCHASED" },
              { label: "Transferred", value: "TRANSFERRED" },
              { label: "Imported", value: "IMPORTED" },
            ]}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assigned Farm Facility *</Text>
            {isLoadingFarms ? (
              <ActivityIndicator
                color="#10a37f"
                style={{ alignSelf: "flex-start" }}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {farms.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.chip, farmId === f.id && styles.chipActive]}
                    onPress={() => setFarmId(f.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        farmId === f.id && styles.chipTextActive,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {farms.length === 0 && (
                  <Text style={styles.helperText}>No farms available</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>

        {/* 4. Pedigree */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="dna" size={20} color="#10a37f" />
            <Text style={styles.sectionTitle}>4. Pedigree (Optional)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mother (Ear Tag / ID)</Text>
            <TextInput
              style={styles.input}
              value={motherTagOrId}
              onChangeText={setMotherTagOrId}
              placeholder="e.g. COW-LK-1002"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Father (Ear Tag / ID)</Text>
            <TextInput
              style={styles.input}
              value={fatherTagOrId}
              onChangeText={setFatherTagOrId}
              placeholder="e.g. BULL-LK-0044"
              autoCapitalize="characters"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploadingPhoto}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Register Livestock</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const SimpleSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}
      >
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, value === opt.value && styles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                styles.chipText,
                value === opt.value && styles.chipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  generateText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10a37f",
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  monoInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "bold",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chipContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#e6f7f2",
    borderColor: "#10a37f",
  },
  chipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#10a37f",
    fontWeight: "bold",
  },
  photoUploadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 13,
    color: "#10a37f",
    fontWeight: "600",
  },
  photoPreviewContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoActions: {
    flexDirection: "row",
    gap: 12,
  },
  photoBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  photoBtnDanger: {
    backgroundColor: "#fee2e2",
  },
  photoBtnText: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  photoBtnTextDanger: {
    fontWeight: "bold",
    color: "#ef4444",
  },
  footer: {
    padding: Spacing.four,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  submitButton: {
    backgroundColor: "#10a37f",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10a37f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
