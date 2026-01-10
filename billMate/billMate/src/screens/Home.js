// src/screens/Home.js
// Firestore 기반 공과금 대시보드 (최근 12개월 + 월 선택 + 사이드 메뉴)

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";

import { auth, db } from "../features/auth/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const BILL_TYPES = ["전기세", "수도세", "가스비"];

// 최근 n개월(오늘 기준, 과거 → 현재) 생성
const buildRecentMonths = (count = 12) => {
  const now = new Date();
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const ymKey = `${year}-${String(month).padStart(2, "0")}`;
    result.push({ year, month, ymKey });
  }
  return result;
};

// Firestore 문서 배열 → summaries + chartsByType
const aggregateBillsByMonth = (billDocs, months) => {
  // { type: { ymKey: amount } }
  const map = {};
  BILL_TYPES.forEach((t) => (map[t] = {}));

  billDocs.forEach((docData) => {
    const ymKey = docData.id; // 문서 ID가 YYYY-MM 이라고 가정 (추측입니다)
    const monthExists = months.some((m) => m.ymKey === ymKey);
    if (!monthExists) return;

    BILL_TYPES.forEach((type) => {
      const raw = docData[type];
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0) return;
      if (!map[type][ymKey]) map[type][ymKey] = 0;
      map[type][ymKey] += value;
    });
  });

  const labels = months.map((m) => `${m.month}월`);
  const chartsByType = {};
  const summaries = [];

  const current = months[months.length - 1];
  const prev = months[months.length - 2];

  BILL_TYPES.forEach((type) => {
    const dataPoints = months.map((m) => map[type][m.ymKey] ?? 0);
    chartsByType[type] = {
      labels,
      datasets: [{ data: dataPoints }],
    };

    const currentAmount = map[type][current.ymKey] ?? 0;
    const prevAmount = prev ? map[type][prev.ymKey] ?? 0 : 0;
    const change =
      prevAmount === 0
        ? 0
        : Math.round(((currentAmount - prevAmount) / prevAmount) * 100);

    summaries.push({
      name: type,
      amount: currentAmount,
      change,
    });
  });

  return { summaries, chartsByType };
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollView: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF" },

  // summaries 가로 슬라이드
  summaryContainer: { marginBottom: 20 },
  summaryCard: {
    width: 200,
    padding: 15,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    marginRight: 12,
  },
  summaryName: { color: "#FFF", fontSize: 16, marginBottom: 5 },
  summaryAmount: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  summaryChange: { color: "#63FF88", fontSize: 14, marginTop: 5 },

  // 공과금 입력 섹션
  inputCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inputTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  monthSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  monthSelectorLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  monthSelectorControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2C",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  monthSelectorButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  monthSelectorButtonText: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  monthSelectorText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 8,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputLabel: {
    width: 60,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  inputBox: {
    flex: 1,
    backgroundColor: "#2A2A2C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFF",
    fontSize: 14,
  },
  inputUnit: {
    marginLeft: 8,
    color: "#8E8E93",
    fontSize: 12,
  },
  inputApplyButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "#63FF88",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inputApplyText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },

  // 그래프 영역
  chartContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    marginBottom: 30,
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 10,
    marginBottom: 10,
  },
  chartTitleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2A2A2C",
  },
  chartTitleText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  chevron: { color: "#9A9AA0", fontSize: 16, marginLeft: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3C",
    marginBottom: 12,
  },
  modalTitle: { color: "#FFF", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#2A2A2C",
    marginBottom: 8,
  },
  modalItemActive: { backgroundColor: "#63FF88" },
  modalItemText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  modalItemTextActive: { color: "#000" },
  modalCancel: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2A2A2C",
    alignItems: "center",
  },
  modalCancelText: { color: "#FFF", fontWeight: "700" },

  communityContainer: {
    padding: 15,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    marginBottom: 100,
  },
  communityTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold", marginBottom: 8 },

  menuOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuDrawer: {
    width: 260,
    backgroundColor: "#111",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  menuTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  menuItem: {
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summaries: [],
    chartsByType: {},
  });

  const [months] = useState(buildRecentMonths(12)); // 최근 12개월
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(months.length - 1);
  const selectedMonth = months[selectedMonthIndex];

  const [selectedType, setSelectedType] = useState("전기세");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [billInputs, setBillInputs] = useState({
    전기세: "",
    수도세: "",
    가스비: "",
  });

  const chartTypes = useMemo(() => BILL_TYPES, []);

  const loadBillsFromFirestore = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해 주세요.");
        return;
      }

      // ✅ 계정별 경로: users/{uid}/bills
      const billsRef = collection(db, "users", user.uid, "bills");
      const snapshot = await getDocs(billsRef);

      const billDocs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const aggregated = aggregateBillsByMonth(billDocs, months);
      setData(aggregated);
    } catch (e) {
      console.log("loadBillsFromFirestore error:", e);
      Alert.alert("오류", "공과금 데이터를 불러오는 중 문제가 발생했습니다.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadBillsFromFirestore();
      setLoading(false);
    })();
  }, []);

  const handleMonthChange = (direction) => {
    setSelectedMonthIndex((prev) => {
      const max = months.length - 1;
      if (direction === "prev") return prev === 0 ? max : prev - 1;
      if (direction === "next") return prev === max ? 0 : prev + 1;
      return prev;
    });
  };

  const ChartConfig = {
    backgroundGradientFrom: "#1C1C1E",
    backgroundGradientTo: "#1C1C1E",
    color: (opacity = 1) => `rgba(99, 255, 136, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForBackgroundLines: { strokeDasharray: "0", stroke: "#3A3A3C" },
  };

  const chartData = data.chartsByType[selectedType];

  const handleApplyBills = async () => {
    const billsNumeric = {};
    BILL_TYPES.forEach((key) => {
      const raw = billInputs[key];
      if (!raw) return;

      const normalized = raw.replace(/,/g, "");
      const value = Number(normalized);
      if (!Number.isFinite(value) || value < 0) return;

      billsNumeric[key] = value;
    });

    if (Object.keys(billsNumeric).length === 0) {
      Alert.alert("입력값 없음", "최소 한 개 이상의 공과금 금액을 입력해 주세요.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해 주세요.");
        return;
      }

      const { ymKey } = selectedMonth;

      // ✅ 계정별 경로: users/{uid}/bills/YYYY-MM 문서에 저장
      const ref = doc(db, "users", user.uid, "bills", ymKey);
      await setDoc(
        ref,
        {
          ...billsNumeric,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setBillInputs({
        전기세: "",
        수도세: "",
        가스비: "",
      });

      await loadBillsFromFirestore();

      Alert.alert(
        "적용 완료",
        `${selectedMonth.year}년 ${selectedMonth.month}월 공과금 금액이 저장 및 반영되었습니다.`
      );
    } catch (e) {
      console.log("handleApplyBills error:", e);
      Alert.alert("오류", "공과금 저장 중 문제가 발생했습니다.");
    }
  };

  if (loading || !chartData) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ flex: 1 }}>
            <Text style={{ color: "#FFF", fontSize: 24 }}>☰</Text>
          </TouchableOpacity>

          <View style={{ flex: 2, alignItems: "center" }}>
            <Text style={styles.headerTitle}>BillMate</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={{ flex: 1, alignItems: "flex-end" }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#8E8E93",
              }}
            />
          </TouchableOpacity>
        </View>

        {/* 1. 공과금 요약 가로 슬라이드 */}
        <View style={styles.summaryContainer}>
          <FlatList
            data={data.summaries}
            keyExtractor={(item, idx) => `${item.name}-${idx}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("BillDetail", {
                    type: item.name,
                  })
                }
              >
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryName}>{item.name}</Text>
                  <Text style={styles.summaryAmount}>
                    {item.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryChange}>
                    전월 대비{" "}
                    {item.change >= 0 ? `+${item.change}` : item.change}%
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 2. 공과금 입력 섹션 */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>공과금 입력</Text>

          <View style={styles.monthSelectorRow}>
            <Text style={styles.monthSelectorLabel}>
              입력할 월을 선택하세요
            </Text>
            <View style={styles.monthSelectorControls}>
              <TouchableOpacity
                style={styles.monthSelectorButton}
                onPress={() => handleMonthChange("prev")}
              >
                <Text style={styles.monthSelectorButtonText}>〈</Text>
              </TouchableOpacity>
              <Text style={styles.monthSelectorText}>
                {selectedMonth.year}년 {selectedMonth.month}월
              </Text>
              <TouchableOpacity
                style={styles.monthSelectorButton}
                onPress={() => handleMonthChange("next")}
              >
                <Text style={styles.monthSelectorButtonText}>〉</Text>
              </TouchableOpacity>
            </View>
          </View>

          {BILL_TYPES.map((key) => (
            <View key={key} style={styles.inputRow}>
              <Text style={styles.inputLabel}>{key}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="0"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={billInputs[key]}
                onChangeText={(text) =>
                  setBillInputs((prev) => ({
                    ...prev,
                    [key]: text,
                  }))
                }
              />
              <Text style={styles.inputUnit}>원</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.inputApplyButton} onPress={handleApplyBills}>
            <Text style={styles.inputApplyText}>적용하기</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 그래프 */}
        <View style={styles.chartContainer}>
          <View style={styles.chartTitleRow}>
            <TouchableOpacity
              style={styles.chartTitleBtn}
              onPress={() => setSelectorVisible(true)}
            >
              <Text style={styles.chartTitleText}>{selectedType}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={chartData}
            width={350}
            height={220}
            chartConfig={ChartConfig}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>

        {/* 4. 커뮤니티 자리 (추후 실제 데이터 연동용) */}
        <View style={styles.communityContainer}>
          <Text style={styles.communityTitle}>OO빌라 커뮤니티</Text>
          <Text style={{ color: "#8E8E93", fontSize: 13 }}>
            커뮤니티 기능은 추후 연동 예정입니다.
          </Text>
        </View>
      </ScrollView>

      {/* 그래프 항목 선택 모달 */}
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectorVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>공과금 항목 선택</Text>

                <FlatList
                  data={chartTypes}
                  keyExtractor={(t) => `opt-${t}`}
                  renderItem={({ item }) => {
                    const active = item === selectedType;
                    return (
                      <TouchableOpacity
                        style={[styles.modalItem, active && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedType(item);
                          setSelectorVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            active && styles.modalItemTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setSelectorVisible(false)}
                >
                  <Text style={styles.modalCancelText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ☰ 사이드 메뉴 모달 */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuDrawer}>
                <Text style={styles.menuTitle}>메뉴</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("Assistant");
                  }}
                >
                  <Text style={styles.menuItemText}>AI 관리비 비서</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("PostList");
                  }}
                >
                  <Text style={styles.menuItemText}>커뮤니티</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("MoveSettlement");
                  }}
                >
                  <Text style={styles.menuItemText}>전입/전출 정산 계산기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("Chatting"); // 라우트 이름
                  }}
                >
                  <Text style={styles.menuItemText}>채팅</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
