// src/screens/BillDetail.js
// Firestore 기반: 선택된 공과금 타입의 최근 12개월 월별 합계 표시

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth, db } from "../features/auth/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

// 최근 n개월(오늘 기준, 과거 → 현재)
const buildRecentMonths = (n = 12) => {
  const now = new Date();
  const list = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const ymKey = `${year}-${String(month).padStart(2, "0")}`;
    list.push({ year, month, ymKey });
  }
  return list;
};

const currency = (n) =>
  typeof n === "number" ? n.toLocaleString("ko-KR") : String(n);

export default function BillDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type = "전기세" } = route.params || {};

  const [months] = useState(buildRecentMonths(12));
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromFirestore = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해 주세요.");
        setRows([]);
        setTotal(0);
        return;
      }

      // ✅ Home과 동일한 경로: users/{uid}/bills
      const billsRef = collection(db, "users", user.uid, "bills");
      const snapshot = await getDocs(billsRef);

      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // { ymKey: amount }
      const map = {};
      docs.forEach((docData) => {
        const ymKey = docData.id;
        const monthExists = months.some((m) => m.ymKey === ymKey);
        if (!monthExists) return;

        const raw = docData[type];
        const value = Number(raw);
        if (!Number.isFinite(value) || value <= 0) return;

        map[ymKey] = (map[ymKey] ?? 0) + value;
      });

      const monthRows = months.map((m) => {
        const amount = map[m.ymKey] ?? 0;
        return {
          ymKey: m.ymKey,
          label: `${m.year}년 ${m.month}월`,
          amount,
        };
      });
      monthRows.reverse();
      const totalAmount = monthRows.reduce(
        (sum, r) => sum + (r.amount || 0),
        0
      );

      setRows(monthRows);
      setTotal(totalAmount);
    } catch (e) {
      console.log("BillDetail load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [months, type]);

  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFromFirestore();
  };

  const renderItem = ({ item }) => (
    <View style={styles.monthRow}>
      <Text style={styles.monthLabel}>{item.label}</Text>
      <Text
        style={[
          styles.monthAmount,
          { opacity: item.amount ? 1 : 0.6 },
        ]}
      >
        {currency(item.amount)}원
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator color="#FFF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 여백 (상태바) */}
      <View style={styles.topSpacer} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}   // ✅ 터치 영역 넓게
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{type} 월별 내역</Text>

        {/* 우측 공간 맞추기용 더미 뷰 */}
        <View style={{ width: 40 }} />
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>최근 12개월 합계</Text>
          <Text style={styles.totalAmount}>{currency(total)}원</Text>
        </View>
        <Text style={styles.totalCount}>표시 개월 수: {rows.length}개월</Text>
      </View>

      {/* 월별 리스트 */}
      <FlatList
        data={rows}
        keyExtractor={(x) => x.ymKey}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              표시할 월별 데이터가 없습니다.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  topSpacer: {
    height:
      Platform.OS === "ios"
        ? 60
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 20
        : 70,
    backgroundColor: "#000",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  summaryCard: {
    backgroundColor: "#1C1C1E",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: { color: "#8E8E93", fontSize: 13 },
  totalAmount: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  totalCount: { color: "#8E8E93", marginTop: 6 },

  separator: { height: 1, backgroundColor: "#2A2A2C", marginVertical: 8 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  monthLabel: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  monthAmount: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  emptyBox: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { color: "#8E8E93", fontSize: 14 },
});
