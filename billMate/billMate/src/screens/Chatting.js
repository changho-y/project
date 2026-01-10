// src/screens/Chatting.js
// 빌라/건물(roadAddress) 단위 익명 채팅방 + 사진/영상 전송
// ✅ 내가 보낸 메시지일 때만 자동 스크롤
// ✅ 채팅방에서 뒤로가기(헤더, 안드로이드 버튼) → 항상 Home
// ✅ BackHandler.removeEventListener 대신 subscription.remove() 사용

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import {
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

import { db } from "../features/auth/firebase";
import { AuthAPI } from "../features/auth/api";
import { Ionicons } from "@expo/vector-icons";

const ANON_NAME_KEY = "billmate_anon_name";

// 익명 닉네임 생성
const generateAnonName = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `익명${num}`;
};

// Timestamp 또는 Date 둘 다 처리
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    return "";
  }
};

export default function Chatting({ navigation }) {
  const route = useRoute();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [anonName, setAnonName] = useState(null);
  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null);

  const [buildingId, setBuildingId] = useState(null); // roadAddress 기반 ID
  const [buildingLabel, setBuildingLabel] = useState(""); // 헤더 표시용
  const [addressLoading, setAddressLoading] = useState(true);

  // ✅ FlatList ref + 내가 보냈을 때만 스크롤할 플래그
  const flatListRef = useRef(null);
  const shouldScrollToEndRef = useRef(false);

  // ───────────────── 사용자 관찰 ─────────────────
  useEffect(() => {
    const unsub = AuthAPI.observe((u) => {
      setUser(u || null);
      setUid(u ? u.uid : null);
    });
    return () => unsub && unsub();
  }, []);

  // ───────────────── 주소 / 건물 ID 불러오기 ─────────────────
  useEffect(() => {
    if (!user) {
      setAddressLoading(false);
      setBuildingId(null);
      setBuildingLabel("");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const data = await AuthAPI.getUser(user.uid);
        if (!mounted) return;

        const addr = data?.address;
        if (addr && addr.roadAddress) {
          const id = addr.roadAddress.trim();
          setBuildingId(id);
          setBuildingLabel(id);
        } else if (typeof data?.address === "string" && data.address.trim()) {
          const id = data.address.trim();
          setBuildingId(id);
          setBuildingLabel(id);
        } else {
          setBuildingId(null);
          setBuildingLabel("");
        }
      } catch (e) {
        console.log("Chatting 주소 불러오기 오류:", e);
        setBuildingId(null);
        setBuildingLabel("");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ───────────────── 익명 닉네임 생성 / 불러오기 ─────────────────
  useEffect(() => {
    const initAnonName = async () => {
      try {
        const saved = await AsyncStorage.getItem(ANON_NAME_KEY);
        if (saved) {
          setAnonName(saved);
        } else {
          const newName = generateAnonName();
          await AsyncStorage.setItem(ANON_NAME_KEY, newName);
          setAnonName(newName);
        }
      } catch (e) {
        const newName = generateAnonName();
        setAnonName(newName);
      }
    };
    initAnonName();
  }, []);

  // ───────────────── Firestore 실시간 구독 ─────────────────
  useEffect(() => {
    if (addressLoading) return;

    if (!buildingId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "buildings", buildingId, "chats"),
      orderBy("createdAt", "asc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(list);
        setLoading(false);
      },
      (error) => {
        console.log("chat onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [buildingId, addressLoading]);

  // ───────────────── 헤더 & 헤더 뒤로가기 버튼 커스터마이즈 ─────────────────
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.navTitle}>익명 채팅</Text>
          <Text style={styles.navSubtitle}>
            {buildingLabel || "집 주소 미등록"}
          </Text>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={{ padding: 8 }}   // 클릭 영역 넓힘
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, buildingLabel]);

  // ───────────────── 안드로이드 하드웨어 뒤로가기 처리 ─────────────────
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          navigation.navigate("Home"); // 항상 Home으로
          return true; // 기본 pop 동작 막기
        }
      );

      return () => {
        subscription.remove(); // ✅ 최신 방식
      };
    }, [navigation])
  );

  // ───────────────── 텍스트 메시지 전송 ─────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !anonName) return;
    if (!buildingId) return;

    setSending(true);
    try {
      const now = new Date();

      await addDoc(collection(db, "buildings", buildingId, "chats"), {
        text,
        mediaUrl: null,
        mediaType: null,
        anonName,
        uid: uid || null,
        createdAt: serverTimestamp(),
        localTime: now,
      });

      setInput("");

      // ✅ 내가 보낸 거니까 다음 리스트 변화 때 맨 아래로 스크롤
      shouldScrollToEndRef.current = true;
    } catch (e) {
      console.log("send error:", e);
    } finally {
      setSending(false);
    }
  }, [input, anonName, uid, buildingId]);

  // ───────────────── EvidenceScreen에서 넘어온 사진/영상 처리 ─────────────────
  const mediaToSend = route.params?.mediaToSend; // { url, type }

  useEffect(() => {
    if (!mediaToSend) return;
    if (!buildingId || !anonName) return;

    const sendMedia = async () => {
      try {
        const { url, type } = mediaToSend; // "image" | "video"
        if (!url || !type) return;

        const now = new Date();

        await addDoc(collection(db, "buildings", buildingId, "chats"), {
          text: "",
          mediaUrl: url,
          mediaType: type,
          anonName,
          uid: uid || null,
          createdAt: serverTimestamp(),
          localTime: now,
        });

        // ✅ 이것도 내가 보낸 거 → 자동 스크롤 플래그
        shouldScrollToEndRef.current = true;
      } catch (e) {
        console.log("send media error:", e);
      } finally {
        navigation.setParams({ mediaToSend: undefined });
      }
    };

    sendMedia();
  }, [mediaToSend, buildingId, anonName, uid, navigation]);

  // ───────────────── 메시지 렌더링 ─────────────────
  const renderItem = ({ item }) => {
    const isMe = uid && item.uid === uid;

    const header = (
      <View style={styles.messageHeader}>
        <Text style={[styles.anonName, isMe && styles.anonNameMe]}>
          {item.anonName}
        </Text>
        <Text style={styles.timeText}>
          {formatTime(item.localTime || item.createdAt)}
        </Text>
      </View>
    );

    let body = null;

    if (item.mediaUrl) {
      if (item.mediaType === "image") {
        body = (
          <View>
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {item.text ? (
              <Text
                style={[
                  styles.messageText,
                  isMe && styles.messageTextMe,
                ]}
              >
                {item.text}
              </Text>
            ) : null}
          </View>
        );
      } else if (item.mediaType === "video") {
        body = (
          <View>
            <View style={styles.mediaVideoBox}>
              <Text style={styles.mediaVideoLabel}>동영상</Text>
            </View>
            {item.text ? (
              <Text
                style={[
                  styles.messageText,
                  isMe && styles.messageTextMe,
                ]}
              >
                {item.text}
              </Text>
            ) : null}
          </View>
        );
      } else {
        body = (
          <Text
            style={[
              styles.messageText,
              isMe && styles.messageTextMe,
            ]}
          >
            {item.text || "[알 수 없는 미디어]"}
          </Text>
        );
      }
    } else {
      body = (
        <Text
          style={[
            styles.messageText,
            isMe && styles.messageTextMe,
          ]}
        >
          {item.text}
        </Text>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {header}
        {body}
      </View>
    );
  };

  const canSend = !!input.trim() && !!anonName && !!buildingId && !sending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {/* 메시지 리스트 / 상태 영역 */}
        <View style={styles.chatContainer}>
          {addressLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>집 주소 불러오는 중...</Text>
            </View>
          ) : !buildingId ? (
            <View style={styles.loadingWrapper}>
              <Text style={styles.loadingText}>
                집 주소가 등록되어 있지 않습니다.
              </Text>
              <Text style={styles.loadingTextSub}>
                프로필 화면에서 집 주소를 등록하면{"\n"}
                같은 빌라/건물 사람들과 익명 채팅을 할 수 있습니다.
              </Text>

              <TouchableOpacity
                style={styles.goProfileButton}
                onPress={() => navigation.navigate("Profile")}
              >
                <Text style={styles.goProfileButtonText}>
                  프로필에서 주소 등록하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>채팅 불러오는 중...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              // ✅ 내용 크기 변할 때
              //    "내가 방금 뭔가 보낸 경우"에만 맨 아래로 스크롤
              onContentSizeChange={() => {
                if (shouldScrollToEndRef.current && flatListRef.current) {
                  flatListRef.current.scrollToEnd({ animated: true });
                  shouldScrollToEndRef.current = false;
                }
              }}
            />
          )}
        </View>

        {/* 하단 입력 */}
        <View style={styles.inputRow}>
          {/* + 버튼 → EvidenceScreen 이동 */}
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => navigation.navigate("Evidence")}
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>

          {/* 메시지 입력 */}
          <TextInput
            style={styles.input}
            placeholder={
              buildingId
                ? "메시지를 입력하세요"
                : "프로필에서 집 주소를 먼저 등록해 주세요"
            }
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            multiline
            editable={!!buildingId}
          />

          {/* 전송 버튼 */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.sendButtonText}>전송</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  navSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#aaa",
  },
  headerBack: {
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 8,
  },

  chatContainer: {
    flex: 1,
    paddingTop: 0,
    marginTop: -8,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  loadingTextSub: {
    marginTop: 6,
    color: "#777",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  goProfileButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#63FF88",
  },
  goProfileButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },

  messageList: {
    paddingVertical: 0,
    paddingHorizontal: 10,
  },

  messageRow: {
    paddingVertical: 4,
    maxWidth: "85%",
  },
  messageRowMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },

  messageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  anonName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  anonNameMe: {
    color: "#63FF88",
  },
  timeText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 8,
  },
  messageText: {
    marginTop: 2,
    fontSize: 16,
    color: "#E5E7EB",
  },
  messageTextMe: {
    textAlign: "right",
  },

  mediaImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 4,
  },
  mediaVideoBox: {
    width: 180,
    height: 120,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  mediaVideoLabel: {
    color: "#63FF88",
    fontSize: 14,
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#111",
    backgroundColor: "#000",
    alignItems: "center",
  },

  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  plusButtonText: {
    fontSize: 22,
    color: "#63FF88",
    fontWeight: "700",
    marginTop: -2,
  },

  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#111",
    color: "#fff",
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#63FF88",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});
