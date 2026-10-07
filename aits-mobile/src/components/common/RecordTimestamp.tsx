import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTimePeriod, getTimePeriodLabel } from "@/utils/time-period";
import { Colors, Spacing } from "@/constants/theme";

interface RecordTimestampProps {
  initialDate?: Date | null;
}

export function RecordTimestamp({ initialDate }: RecordTimestampProps) {
  // If editing an existing record, we freeze the time to `initialDate`.
  // If creating new, we use the current date/time and freeze it when the component mounts.
  const [capturedDate] = useState<Date>(() => initialDate || new Date());

  const period = getTimePeriod(capturedDate);
  const periodLabel = getTimePeriodLabel(period);

  const formattedDate = capturedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = capturedDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>RECORD CREATION INFO</Text>

      <View style={styles.row}>
        <View style={styles.item}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.value}>{formattedDate}</Text>
        </View>

        <View style={styles.item}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.value}>{formattedTime}</Text>
        </View>
      </View>

      <View style={[styles.item, styles.periodContainer]}>
        <Ionicons
          name={period === "NIGHT" ? "moon-outline" : "sunny-outline"}
          size={16}
          color="#0ea5e9"
        />
        <Text style={styles.periodText}>{periodLabel}</Text>
      </View>

      <Text style={styles.helpText}>
        Authoritative timestamp is applied by the server upon submission.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.four,
    marginBottom: Spacing.two,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  periodContainer: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: Spacing.two,
  },
  periodText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
  },
  helpText: {
    fontSize: 10,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
