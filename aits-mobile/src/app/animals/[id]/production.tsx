import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService } from "@/services/production.service";
import Toast from "react-native-toast-message";
import { Spacing } from "@/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimalDetailResponse } from "@/types/animals";

const productionSchema = z.object({
  quantityLiters: z.coerce.number().refine((val) => !isNaN(val) && val > 0, {
    message: "Quantity must be a positive number",
  }),
  milkingSession: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
});

type ProductionForm = z.infer<typeof productionSchema>;

export default function MilkProductionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const animal = queryClient.getQueryData<AnimalDetailResponse>(["animal", id]);
  const { hasPermissionOnFarm } = useAuthStore();
  const canAdd = hasPermissionOnFarm("MANAGE_PRODUCTION", animal?.farmId);

  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["production", id],
    queryFn: () =>
      productionService.getRecords({ animalId: id as string, limit: 10 }),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: ProductionForm) => {
      return productionService.createRecord({
        animalId: id as string,
        farmId: animal?.farmId as string,
        date: new Date().toISOString(),
        quantityLiters: data.quantityLiters,
        session: data.milkingSession,
        qualityStatus: "NORMAL" as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production", id] });
      setIsAdding(false);
      reset();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Milk record added successfully.",
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          err.response?.data?.message || err.message || "Failed to add record",
      });
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof productionSchema>>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      quantityLiters: "",
      milkingSession: "MORNING",
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.date}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <View style={styles.row}>
        <Text style={styles.session}>{item.session}</Text>
        <Text style={styles.qty}>{item.quantityLiters} L</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {canAdd && !isAdding && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAdding(true)}
        >
          <Text style={styles.addButtonText}>+ Log Milk</Text>
        </TouchableOpacity>
      )}

      {isAdding && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Record</Text>

          <Text style={styles.label}>Quantity (Liters)</Text>
          <Controller
            control={control}
            name="quantityLiters"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value as string}
                placeholder="e.g. 15.5"
              />
            )}
          />
          {errors.quantityLiters && (
            <Text style={styles.errorText}>
              {errors.quantityLiters.message as string}
            </Text>
          )}

          <Text style={styles.label}>Session</Text>
          <View style={styles.sessionRow}>
            {["MORNING", "AFTERNOON", "EVENING"].map((session) => (
              <Controller
                key={session}
                control={control}
                name="milkingSession"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[
                      styles.sessionBtn,
                      value === session && styles.sessionBtnActive,
                    ]}
                    onPress={() => onChange(session)}
                  >
                    <Text
                      style={[
                        styles.sessionBtnText,
                        value === session && styles.sessionBtnTextActive,
                      ]}
                    >
                      {session.charAt(0) + session.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ))}
          </View>
          {errors.milkingSession && (
            <Text style={styles.errorText}>
              {errors.milkingSession.message as string}
            </Text>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAdding(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit(onSubmit)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: Spacing.four }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No milk records found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    backgroundColor: "#f9f9f9",
  },
  addButton: {
    backgroundColor: "#10a37f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  date: {
    fontSize: 13,
    color: "#5d5d5d",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  session: {
    fontSize: 15,
    color: "#0d0d0d",
    fontWeight: "500",
  },
  qty: {
    fontSize: 16,
    color: "#0ea5e9",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#5d5d5d",
    marginTop: Spacing.four,
  },
  formCard: {
    backgroundColor: "#ffffff",
    padding: Spacing.four,
    borderRadius: 8,
    marginBottom: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.three,
    color: "#0d0d0d",
  },
  label: {
    fontSize: 13,
    color: "#5d5d5d",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f4f4f4",
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    color: "#0d0d0d",
  },
  sessionRow: {
    flexDirection: "row",
    gap: 8,
  },
  sessionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f4f4f4",
    borderRadius: 6,
    alignItems: "center",
  },
  sessionBtnActive: {
    backgroundColor: "rgba(16, 163, 127, 0.1)",
    borderColor: "#10a37f",
  },
  sessionBtnText: {
    fontSize: 13,
    color: "#5d5d5d",
    fontWeight: "600",
  },
  sessionBtnTextActive: {
    color: "#10a37f",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 4,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: Spacing.four,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: "#5d5d5d",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#10a37f",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
