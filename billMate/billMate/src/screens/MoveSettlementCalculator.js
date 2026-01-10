// src/screens/MoveSettlementCalculator.js

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons"; // ✅ 공통 뒤로가기 아이콘

const parseReading = (value) => {
  if (!value || !value.trim()) return null;
  const normalized = value.replace(/,/g, "");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  return number;
};

const formatCurrency = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "-";
  return Math.round(value).toLocaleString("ko-KR");
};

const formatUsage = (value) => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const formatUnitRate = (value) => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const normalizeDate = (date) => {
  const next = new Date(date.getTime());
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatDateLabel = (date) => {
  if (!date) return "날짜 선택";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function MoveSettlementCalculator({ navigation }) {
  const [totalAmount, setTotalAmount] = useState("");
  const [endReading, setEndReading] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("");

  const [moveOutDate, setMoveOutDate] = useState(null);
  const [moveInDate, setMoveInDate] = useState(null);

  const [moveOutReading, setMoveOutReading] = useState("");
  const [moveInReading, setMoveInReading] = useState("");

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [isMoveOutPickerVisible, setMoveOutPickerVisible] = useState(false);
  const [isMoveInPickerVisible, setMoveInPickerVisible] = useState(false);

  const handleNumericInput = (text, setter) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setter(cleaned);
  };

  const resetAll = () => {
    setTotalAmount("");
    setEndReading("");
    setMonthlyUsage("");
    setMoveOutDate(null);
    setMoveInDate(null);
    setMoveOutReading("");
    setMoveInReading("");
    setError("");
    setResult(null);
    setMoveOutPickerVisible(false);
    setMoveInPickerVisible(false);
  };

  const onCalculate = () => {
    setError("");

    const amount = Number(totalAmount.replace(/,/g, ""));
    const endReadingValue = parseReading(endReading);
    const monthlyUsageValue = parseReading(monthlyUsage);
    const moveOutReadingValue = parseReading(moveOutReading);
    const moveInReadingValue = parseReading(moveInReading);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("총 청구 금액을 입력해주세요.");
      setResult(null);
      return;
    }

    if (
      endReadingValue === null ||
      monthlyUsageValue === null ||
      moveOutReadingValue === null ||
      moveInReadingValue === null
    ) {
      setError("계량기 지침(kWh)과 이번 달 사용량을 모두 입력해주세요.");
      setResult(null);
      return;
    }

    if (endReadingValue < 0 || monthlyUsageValue < 0) {
      setError("계량기 지침과 사용량은 0 이상의 숫자여야 합니다.");
      setResult(null);
      return;
    }

    if (!moveOutDate || !moveInDate) {
      setError("전출일과 전입일을 모두 선택해주세요.");
      setResult(null);
      return;
    }

    if (moveInDate < moveOutDate) {
      setError("전입일은 전출일과 같거나 그 이후여야 합니다.");
      setResult(null);
      return;
    }

    if (moveOutReadingValue < 0 || moveInReadingValue < 0) {
      setError("계량기 지침은 0 이상의 숫자여야 합니다.");
      setResult(null);
      return;
    }

    if (monthlyUsageValue === 0) {
      setError("이번 달 사용량이 0이면 금액을 나눌 수 없습니다.");
      setResult(null);
      return;
    }

    if (monthlyUsageValue > endReadingValue) {
      setError("이번 달 사용량이 청구 종료 지침보다 클 수 없습니다.");
      setResult(null);
      return;
    }

    const startReadingValue = endReadingValue - monthlyUsageValue;

    if (startReadingValue < 0) {
      setError("청구 시작 지침이 0 미만이 되지 않도록 값을 확인해주세요.");
      setResult(null);
      return;
    }

    if (moveOutReadingValue < startReadingValue) {
      setError("전출일 지침은 청구 시작 지침 이상이어야 합니다.");
      setResult(null);
      return;
    }

    if (moveInReadingValue < moveOutReadingValue) {
      setError("전입일 지침은 전출일 지침 이상이어야 합니다.");
      setResult(null);
      return;
    }

    if (moveInReadingValue > endReadingValue) {
      setError("전입일 지침은 청구 종료 지침을 초과할 수 없습니다.");
      setResult(null);
      return;
    }

    const totalUsage = monthlyUsageValue;
    const unitRate = amount / totalUsage;

    const previousUsage = moveOutReadingValue - startReadingValue; // 전출자
    const gapUsage = moveInReadingValue - moveOutReadingValue; // 집주인(공백 기간)
    const nextUsage = endReadingValue - moveInReadingValue; // 전입자

    if (previousUsage < 0 || gapUsage < 0 || nextUsage < 0) {
      setError("계량기 지침을 다시 확인해주세요.");
      setResult(null);
      return;
    }

    const usageSum = previousUsage + gapUsage + nextUsage;
    if (Math.abs(usageSum - totalUsage) > 0.0001) {
      setError(
        "전출/전입/공백 기간 사용량의 합이 이번 달 사용량과 일치하지 않습니다. 지침 값을 다시 확인해주세요."
      );
      setResult(null);
      return;
    }

    setResult({
      totalUsage,
      unitRate,
      startReading: startReadingValue,
      endReading: endReadingValue,
      dates: {
        moveOut: moveOutDate,
        moveIn: moveInDate,
      },
      previous: {
        usage: previousUsage,
        amount: unitRate * previousUsage,
      },
      gap: {
        usage: gapUsage,
        amount: unitRate * gapUsage,
      },
      next: {
        usage: nextUsage,
        amount: unitRate * nextUsage,
      },
    });
  };

  const showMoveOutPicker = () => setMoveOutPickerVisible(true);
  const hideMoveOutPicker = () => setMoveOutPickerVisible(false);
  const showMoveInPicker = () => setMoveInPickerVisible(true);
  const hideMoveInPicker = () => setMoveInPickerVisible(false);

  const handleMoveOutConfirm = (date) => {
    setMoveOutDate(normalizeDate(date));
    hideMoveOutPicker();
  };

  const handleMoveInConfirm = (date) => {
    setMoveInDate(normalizeDate(date));
    hideMoveInPicker();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton} // ✅ 통일된 스타일
            >
              <Ionicons name="chevron-back" size={30} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>전입/전출 정산 계산기</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* 안내 문구 */}
          <Text style={styles.subtitle}>
            이번 달 전기요금 고지서 기준으로{"\n"}
            전출자·전입자·집주인 부담금을{" "}
            <Text style={{ fontWeight: "700" }}>계량기 지침(kWh)</Text>만을
            이용하여 나눠 계산합니다.{"\n"}
            날짜는 기록 및 검증용으로만 사용되며, 실제 금액 배분은{" "}
            <Text style={{ fontWeight: "700" }}>계량기 사용량 비율</Text>만
            반영됩니다.
          </Text>

          {/* 1. 청구 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. 청구 정보</Text>

            <View style={styles.field}>
              <Text style={styles.label}>총 청구 금액 (원)</Text>
              <TextInput
                placeholder="예: 120,000"
                placeholderTextColor="#555"
                value={totalAmount}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9]/g, "");
                  if (!digits) {
                    setTotalAmount("");
                    return;
                  }
                  const formatted = Number(digits).toLocaleString("ko-KR");
                  setTotalAmount(formatted);
                }}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>청구 종료 계량기 지침 (kWh)</Text>
              <TextInput
                placeholder="예: 11000"
                placeholderTextColor="#555"
                value={endReading}
                onChangeText={(text) => handleNumericInput(text, setEndReading)}
                style={styles.input}
                keyboardType={
                  Platform.OS === "ios" ? "decimal-pad" : "numeric"
                }
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>이번 달 사용량 (kWh)</Text>
              <TextInput
                placeholder="예: 250"
                placeholderTextColor="#555"
                value={monthlyUsage}
                onChangeText={(text) =>
                  handleNumericInput(text, setMonthlyUsage)
                }
                style={styles.input}
                keyboardType={
                  Platform.OS === "ios" ? "decimal-pad" : "numeric"
                }
              />
            </View>
          </View>

          {/* 2. 전출/전입 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 전출/전입 정보</Text>
            <Text style={styles.sectionDescription}>
              전출자와 전입자는 각각 입·퇴거 당일{" "}
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                계량기 지침(계량기 숫자, kWh 단위)
              </Text>
              을 입력해주세요.{"\n"}
              청구 시작 지침은{" "}
              <Text style={{ fontWeight: "600", color: "#FFF" }}>
                "청구 종료 지침 - 이번 달 사용량"
              </Text>
              으로 계산하며, 전출자 / 공백 기간(집주인) / 전입자의 사용량 비율에
              따라 요금을 나눕니다.
            </Text>

            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.label}>전출일</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={showMoveOutPicker}
                  activeOpacity={0.85}
                >
                  <Text
                    style={
                      moveOutDate
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateLabel(moveOutDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>전출일 계량기 지침 (kWh)</Text>
                <TextInput
                  placeholder="예: 10300 "
                  placeholderTextColor="#555"
                  value={moveOutReading}
                  onChangeText={(text) =>
                    handleNumericInput(text, setMoveOutReading)
                  }
                  style={styles.input}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.label}>전입일</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={showMoveInPicker}
                  activeOpacity={0.85}
                >
                  <Text
                    style={
                      moveInDate
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateLabel(moveInDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>전입일 계량기 지침 (kWh)</Text>
                <TextInput
                  placeholder="예: 10500"
                  placeholderTextColor="#555"
                  value={moveInReading}
                  onChangeText={(text) =>
                    handleNumericInput(text, setMoveInReading)
                  }
                  style={styles.input}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                />
              </View>
            </View>
          </View>

          {/* 에러 메시지 */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 버튼 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetAll}>
              <Text style={styles.secondaryButtonText}>초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onCalculate}>
              <Text style={styles.primaryButtonText}>계산하기</Text>
            </TouchableOpacity>
          </View>

          {/* 결과 */}
          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>계산 결과</Text>
              <Text style={styles.resultSummary}>
                이번 달 사용량 {formatUsage(result.totalUsage)}kWh (시작 지침{" "}
                {formatUsage(result.startReading)} → 종료 지침{" "}
                {formatUsage(result.endReading)})
              </Text>
              <Text style={styles.resultSummary}>
                1kWh당 {formatUnitRate(result.unitRate)}원 기준으로
                사용량 비례 배분했어요.
              </Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>전출자 부담</Text>
                <Text style={styles.resultValue}>
                  {formatUsage(result.previous.usage)}kWh ·{" "}
                  {formatCurrency(result.previous.amount)}원
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>집주인 (공백 기간)</Text>
                <Text style={styles.resultValue}>
                  {formatUsage(result.gap.usage)}kWh ·{" "}
                  {formatCurrency(result.gap.amount)}원
                </Text>
              </View>

              <View style={[styles.resultRow, styles.resultRowLast]}>
                <Text style={styles.resultLabel}>전입자 부담</Text>
                <Text style={styles.resultValue}>
                  {formatUsage(result.next.usage)}kWh ·{" "}
                  {formatCurrency(result.next.amount)}원
                </Text>
              </View>

              <Text style={styles.note}>
                ※ 실제 전기요금은 구간별 단가, 기본요금, 부가세, 전력사 정책에
                따라 달라질 수 있습니다. 이 계산기는{" "}
                <Text style={{ fontWeight: "600" }}>
                  한 달 총 청구금액을 계량기 사용량 비율로 단순 분할
                </Text>
                하는 용도로 사용해주세요.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 전출일 DatePicker */}
      <DateTimePickerModal
        isVisible={isMoveOutPickerVisible}
        mode="date"
        locale="ko-KR"
        confirmTextIOS="확인"
        cancelTextIOS="취소"
        onConfirm={handleMoveOutConfirm}
        onCancel={hideMoveOutPicker}
      />

      {/* 전입일 DatePicker */}
      <DateTimePickerModal
        isVisible={isMoveInPickerVisible}
        mode="date"
        locale="ko-KR"
        confirmTextIOS="확인"
        cancelTextIOS="취소"
        onConfirm={handleMoveInConfirm}
        onCancel={hideMoveInPicker}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  subtitle: {
    color: "#C7C7CC",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionDescription: {
    color: "#8E8E93",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    color: "#8E8E93",
    fontSize: 13,
    marginBottom: 6,
  },
  dateInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#2A2A2C",
    justifyContent: "center",
  },
  datePlaceholderText: {
    color: "#555",
    fontSize: 15,
  },
  dateValueText: {
    color: "#FFF",
    fontSize: 15,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#2A2A2C",
    color: "#FFF",
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: "#3A1A1E",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#FF6B6B", fontSize: 13, lineHeight: 18 },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#63FF88",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#2A2A2C",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 18,
  },
  resultTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultSummary: {
    color: "#C7C7CC",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2C",
  },
  resultRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  resultLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  resultValue: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  note: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 16,
    lineHeight: 18,
  },
});
