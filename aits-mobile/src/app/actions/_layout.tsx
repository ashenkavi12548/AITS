import React from "react";
import { Stack } from "expo-router";

export default function ActionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0d0d0d",
        headerTitleStyle: { fontWeight: "700" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="add-health" options={{ title: "Add Health Record" }} />
      <Stack.Screen
        name="add-milk"
        options={{ title: "Log Milk Production" }}
      />
      <Stack.Screen
        name="add-breeding"
        options={{ title: "Record Breeding" }}
      />
      <Stack.Screen
        name="add-movement"
        options={{ title: "Record Movement" }}
      />
    </Stack>
  );
}
