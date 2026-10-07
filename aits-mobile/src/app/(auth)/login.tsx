import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Please enter a valid email address or mobile number")
    .regex(
      /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|[\d\s\-()+]+)$/,
      "Please enter a valid email address or mobile number",
    ),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isIdFocused, setIsIdFocused] = useState(false);
  const [isPwFocused, setIsPwFocused] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLocalError("");
    const success = await login({
      identifier: data.identifier,
      password: data.password,
    });
    if (!success) {
      setLocalError(useAuthStore.getState().error || "Login failed");
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/farm-login-bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Feather
                  name="activity"
                  size={32}
                  color={Colors.light.primary}
                />
              </View>
              <Text style={styles.title}>Sign In to AITS</Text>
              <Text style={styles.subtitle}>
                Livestock Identification & Traceability
              </Text>
            </View>

            {(error || localError) && (
              <View style={styles.errorContainer}>
                <Feather
                  name="alert-circle"
                  size={16}
                  color={Colors.light.secondary}
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.errorText}>{error || localError}</Text>
                <TouchableOpacity
                  onPress={() => setLocalError("")}
                  style={styles.closeError}
                >
                  <Feather name="x" size={16} color={Colors.light.secondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={18}
                  color={
                    isIdFocused
                      ? Colors.light.primary
                      : Colors.light.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        isIdFocused && styles.inputFocused,
                        errors.identifier && styles.inputError,
                      ]}
                      onFocus={() => setIsIdFocused(true)}
                      onBlur={() => {
                        setIsIdFocused(false);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      placeholder="farmer@livestock.lk or +94 77 123 4567"
                      placeholderTextColor={Colors.light.textSecondary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  )}
                />
              </View>
              {errors.identifier && (
                <Text style={styles.helperText}>
                  {errors.identifier.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={18}
                  color={
                    isPwFocused
                      ? Colors.light.primary
                      : Colors.light.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        isPwFocused && styles.inputFocused,
                        errors.password && styles.inputError,
                      ]}
                      onFocus={() => setIsPwFocused(true)}
                      onBlur={() => {
                        setIsPwFocused(false);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter your security password"
                      placeholderTextColor={Colors.light.textSecondary}
                      secureTextEntry={!showPassword}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.helperText}>{errors.password.message}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator
                    color={Colors.light.background}
                    size="small"
                  />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Authenticating...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={Colors.light.background}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerBadges}>
            <View style={styles.badge}>
              <Feather name="shield" size={12} color={Colors.light.primary} />
              <Text style={styles.badgeText}>JWT Secure</Text>
            </View>
            <View style={styles.badge}>
              <Feather name="cpu" size={12} color={Colors.light.secondary} />
              <Text style={styles.badgeText}>RBAC Active</Text>
            </View>
            <View style={styles.badge}>
              <Feather name="globe" size={12} color={Colors.light.accent} />
              <Text style={styles.badgeText}>ISO 22005</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 163, 127, 0.2)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0d0d0d",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#5d5d5d",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d5d5d",
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPassword: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#f4f4f4",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 46,
    paddingRight: 16,
    fontSize: 15,
    color: "#0d0d0d",
  },
  inputFocused: {
    borderColor: Colors.light.primary,
    backgroundColor: "#ffffff",
  },
  passwordInput: {
    paddingRight: 46,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  helperText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  closeError: {
    padding: 2,
  },
  footerBadges: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    gap: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
});
