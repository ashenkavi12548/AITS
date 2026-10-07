import "../../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isInitialized, isAuthenticated, initAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    // Use a small delay to ensure NavigationContainer is ready
    // especially when relying on segments
    setTimeout(() => {
      const inAuthGroup = (segments[0] as string) === "(auth)";

      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login" as any);
      } else if (isAuthenticated && inAuthGroup) {
        router.replace("/(tabs)" as any);
      }
    }, 0);
  }, [isAuthenticated, isInitialized, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="actions" options={{ headerShown: false }} />
          <Stack.Screen name="animals/[id]" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
      <Toast />
    </QueryClientProvider>
  );
}
