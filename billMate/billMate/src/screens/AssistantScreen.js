// src/screens/AssistantScreen.js

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // ✅ 공통 뒤로가기 아이콘

// ⚠️ 네트워크 설정
const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:5050"
    : Platform.OS === "web"
    ? "http://localhost:5050"
    : "http://localhost:5050";

const STORAGE_KEYS = {
  RECORDS: "@billmate_ai_records_v1",
};

async function callAssistantAPI(message) {
  try {
    const res = await fetch(`${API_BASE}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("bad status");
    return await res.json();
  } catch (e) {
    return {
      type: "smalltalk",
      category: null,
      amount: null,
      replyText: "서버 연결에 실패했어요.",
    };
  }
}

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfWeek = (d = new Date()) => {
  const nd = new Date(d);
  const day = nd.getDay();
  const diff = (day + 6) % 7;
  nd.setDate(nd.getDate() - diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
};

const endOfWeek = (d = new Date()) => {
  const s = startOfWeek(d);
  const nd = new Date(s);
  nd.setDate(s.getDate() + 6);
  nd.setHours(23, 59, 59, 999);
  return nd;
};

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

async function loadRecords() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

async function saveRecords(next) {
  await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(next));
}

function summarize(records) {
  const now = new Date();
  const sWeek = startOfWeek(now);
  const eWeek = endOfWeek(now);
  const sMonth = startOfMonth(now);
  const eMonth = endOfMonth(now);

  const within = (record, start, end) => {
    const t = new Date(record.timestamp);
    return t >= start && t <= end;
  };

  const weekly = records.filter((r) => within(r, sWeek, eWeek));
  const monthly = records.filter((r) => within(r, sMonth, eMonth));

  const categories = ["전기세", "수도세", "가스비", "관리비"];

  const totalByCategory = (arr, category) =>
    arr
      .filter((r) => r.category === category)
      .reduce((acc, cur) => acc + (cur.amount || 0), 0);

  const weeklyTotals = categories.reduce(
    (acc, cat) => ({ ...acc, [cat]: totalByCategory(weekly, cat) }),
    {}
  );
  const monthlyTotals = categories.reduce(
    (acc, cat) => ({ ...acc, [cat]: totalByCategory(monthly, cat) }),
    {}
  );

  return { weekly: weeklyTotals, monthly: monthlyTotals, count: records.length };
}

function formatCurrency(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "0원";
  return `${amount.toLocaleString()}원`;
}

function assistantReply(message, records) {
  const norm = message.trim();
  if (!norm) {
    return "무엇을 도와드릴까요? 예: '이번주 요약', '전기세 45000원 기록'";
  }

  if (/^(요약|이번주 요약|주간 요약)$/i.test(norm)) {
    const summary = summarize(records);
    return (
      `이번주 전기세 ${formatCurrency(summary.weekly.전기세 || 0)}, ` +
      `수도세 ${formatCurrency(summary.weekly.수도세 || 0)}, ` +
      `가스비 ${formatCurrency(summary.weekly.가스비 || 0)}, ` +
      `관리비 ${formatCurrency(summary.weekly.관리비 || 0)} 입니다.`
    );
  }

  if (/^(이번달 요약|월간 요약)$/i.test(norm)) {
    const summary = summarize(records);
    return (
      `이번달 전기세 ${formatCurrency(summary.monthly.전기세 || 0)}, ` +
      `수도세 ${formatCurrency(summary.monthly.수도세 || 0)}, ` +
      `가스비 ${formatCurrency(summary.monthly.가스비 || 0)}, ` +
      `관리비 ${formatCurrency(summary.monthly.관리비 || 0)} 입니다.`
    );
  }

  const quickAdd = norm.match(/(전기세|수도세|가스비|관리비)\s*(\d+)/);
  if (quickAdd) {
    const [, category, amount] = quickAdd;
    return `➕ '${category} ${Number(amount).toLocaleString()}원'으로 저장하려면 빠른 기록 버튼을 눌러주세요.`;
  }

  return "'이번주 요약', '이번달 요약', '전기세 45000원' 처럼 물어보시면 돼요.";
}

const CATEGORY_LIST = ["전기세", "수도세", "가스비", "관리비", "메모"];

export default function AssistantScreen({ navigation }) {
  const [tab, setTab] = useState("기록");
  const [records, setRecords] = useState([]);
  const [category, setCategory] = useState(CATEGORY_LIST[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [chat, setChat] = useState([]);
  const [userMsg, setUserMsg] = useState("");
  const listRef = useRef(null);

  // ✅ 공통 뒤로가기 버튼 + 헤더 스타일
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: "#000" },
      headerTintColor: "#fff",
      headerTitle: "AI 관리비 비서",
      headerTitleStyle: { color: "#fff", fontWeight: "700", fontSize: 18 },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const initial = await loadRecords();
      setRecords(initial);
    })();
  }, []);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const addRecord = () => {
    const trimmed = amount.trim();
    const numeric =
      trimmed === "" ? undefined : Number(trimmed.replace(/[^0-9.-]/g, ""));
    if (numeric !== undefined && Number.isNaN(numeric)) {
      Alert.alert("입력 오류", "금액에 숫자를 입력해주세요.");
      return;
    }

    const now = new Date();
    const item = {
      id: `${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.getTime(),
      date: ymd(now),
      category,
      amount: numeric,
      note: note.trim() || undefined,
    };

    setRecords((prev) => [item, ...prev]);
    setAmount("");
    setNote("");
    Alert.alert("저장 완료", `${item.category} 기록이 저장되었어요.`);
  };

  const sendMsg = async () => {
    const text = userMsg.trim();
    if (!text) return;

    setChat((prev) => [
      ...prev,
      { id: `${Date.now()}_u`, role: "user", text },
    ]);
    setUserMsg("");

    const ai = await callAssistantAPI(text);

    let finalReply = ai.replyText || "";

    if (ai.type === "add_record" && ai.category && typeof ai.amount === "number") {
      const now = new Date();
      const item = {
        id: `${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: now.getTime(),
        date: ymd(now),
        category: ai.category,
        amount: ai.amount,
        note: "AI 기록",
      };
      setRecords((prev) => [item, ...prev]);
      finalReply = `${ai.category} ${ai.amount.toLocaleString()}원이 저장되었어요.`;
    } else if (ai.type === "summary_week") {
      const s = summarize(records);
      finalReply =
        `이번주 전기세 ${formatCurrency(s.weekly.전기세 || 0)}, ` +
        `수도세 ${formatCurrency(s.weekly.수도세 || 0)}, ` +
        `가스비 ${formatCurrency(s.weekly.가스비 || 0)}, ` +
        `관리비 ${formatCurrency(s.weekly.관리비 || 0)} 입니다.`;
    } else if (ai.type === "summary_month") {
      const s = summarize(records);
      finalReply =
        `이번달 전기세 ${formatCurrency(s.monthly.전기세 || 0)}, ` +
        `수도세 ${formatCurrency(s.monthly.수도세 || 0)}, ` +
        `가스비 ${formatCurrency(s.monthly.가스비 || 0)}, ` +
        `관리비 ${formatCurrency(s.monthly.관리비 || 0)} 입니다.`;
    }

    setChat((prev) => [
      ...prev,
      { id: `${Date.now()}_a`, role: "assistant", text: finalReply },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const quickAdd = () => {
    const norm = userMsg.trim();
    const matched = norm.match(/(전기세|수도세|가스비|관리비)\s*(\d+)/);
    if (!matched) {
      Alert.alert("형식 안내", "예) 전기세 45000, 관리비 80000");
      return;
    }
    const [, cat, amountText] = matched;
    const now = new Date();
    const item = {
      id: `${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.getTime(),
      date: ymd(now),
      category: cat,
      amount: Number(amountText),
      note: "AI 빠른 기록",
    };
    setRecords((prev) => [item, ...prev]);
    Alert.alert(
      "빠른 기록",
      `${cat} ${Number(amountText).toLocaleString()}원이 저장되었어요.`
    );
  };

  const insights = useMemo(() => summarize(records), [records]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* 탭 버튼 */}
      <View
        style={{
          flexDirection: "row",
          padding: 16,
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        {[
          { key: "기록", label: "기록" },
          { key: "히스토리", label: "히스토리" },
          { key: "채팅", label: "채팅" },
          { key: "인사이트", label: "인사이트" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setTab(item.key)}
            style={{
              flex: 1,
              marginRight: item.key === "인사이트" ? 0 : 8,
              backgroundColor: tab === item.key ? "#63FF88" : "#1C1C1E",
              borderRadius: 999,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: tab === item.key ? "#000" : "#E5E7EB",
                fontWeight: "700",
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {/* 기록 탭 */}
        {tab === "기록" && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text
              style={{
                color: "#FFF",
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 16,
              }}
            >
              ✍️ 관리비 기록 추가
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {CATEGORY_LIST.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor:
                      category === c ? "#63FF88" : "#1C1C1E",
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: category === c ? "#000" : "#E5E7EB",
                      fontWeight: "700",
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="금액 (예: 45000)"
              placeholderTextColor="#6B7280"
              style={{
                backgroundColor: "#111",
                color: "#FFF",
                borderWidth: 1,
                borderColor: "#1F2937",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            />

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="메모 (선택)"
              placeholderTextColor="#6B7280"
              style={{
                backgroundColor: "#111",
                color: "#FFF",
                borderWidth: 1,
                borderColor: "#1F2937",
                borderRadius: 12,
                padding: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              multiline
            />

            <TouchableOpacity
              onPress={addRecord}
              style={{
                marginTop: 16,
                backgroundColor: "#63FF88",
                padding: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#000", fontWeight: "800" }}>
                저장하기
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* 히스토리 탭 */}
        {tab === "히스토리" && (
          <FlatList
            contentContainerStyle={{ padding: 20 }}
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#1C1C1E",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#2A2A2C",
                }}
              >
                <Text
                  style={{ color: "#63FF88", fontWeight: "700" }}
                >
                  {item.date} · {item.category}
                </Text>
                <Text style={{ color: "#FFF", marginTop: 6 }}>
                  {typeof item.amount === "number"
                    ? `${item.amount.toLocaleString()}원`
                    : "금액 없음"}
                </Text>
                {item.note ? (
                  <Text
                    style={{ color: "#9CA3AF", marginTop: 6 }}
                  >
                    {item.note}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )}

        {/* 채팅 탭 */}
        {tab === "채팅" && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <FlatList
              ref={listRef}
              contentContainerStyle={{ padding: 20 }}
              data={chat}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    marginBottom: 12,
                    alignItems:
                      item.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <View
                    style={{
                      maxWidth: "80%",
                      backgroundColor:
                        item.role === "user"
                          ? "#63FF88"
                          : "#1C1C1E",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          item.role === "user" ? "#000" : "#FFF",
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
            />

            <View
              style={{
                flexDirection: "row",
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: "#1F2937",
                backgroundColor: "#000",
              }}
            >
              <TextInput
                value={userMsg}
                onChangeText={setUserMsg}
                placeholder="AI에게 물어보기"
                placeholderTextColor="#6B7280"
                style={{
                  flex: 1,
                  backgroundColor: "#111",
                  color: "#FFF",
                  borderWidth: 1,
                  borderColor: "#1F2937",
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginRight: 8,
                }}
              />
              <TouchableOpacity
                onPress={quickAdd}
                style={{
                  backgroundColor: "#1C1C1E",
                  paddingHorizontal: 12,
                  justifyContent: "center",
                  borderRadius: 999,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{ color: "#E5E7EB", fontWeight: "700" }}
                >
                  빠른 기록
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendMsg}
                style={{
                  backgroundColor: "#63FF88",
                  paddingHorizontal: 18,
                  justifyContent: "center",
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: "#000", fontWeight: "800" }}
                >
                  전송
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* 인사이트 탭 */}
        {tab === "인사이트" && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text
              style={{
                color: "#FFF",
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 16,
              }}
            >
              📈 인사이트
            </Text>
            <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>
              이번주 전기세 {formatCurrency(insights.weekly.전기세 || 0)} / 수도세{" "}
              {formatCurrency(insights.weekly.수도세 || 0)}
            </Text>
            <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>
              이번달 전기세 {formatCurrency(insights.monthly.전기세 || 0)} / 수도세{" "}
              {formatCurrency(insights.monthly.수도세 || 0)}
            </Text>
            <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>
              이번달 가스비 {formatCurrency(insights.monthly.가스비 || 0)} / 관리비{" "}
              {formatCurrency(insights.monthly.관리비 || 0)}
            </Text>
            <Text style={{ color: "#9CA3AF" }}>
              총 기록 {insights.count}개
            </Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
