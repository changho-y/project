// src/screens/EvidenceScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons"; // ✅ 공통 뒤로가기 아이콘
import { AuthAPI } from "../features/auth/api";
import { db } from "../features/auth/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EvidenceScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 로그인 유저 관찰
  useEffect(() => {
    const unsub = AuthAPI.observe((u) => {
      setUser(u);
    });
    return () => unsub && unsub();
  }, []);

  // 내 증거 목록 실시간 구독
  useEffect(() => {
    if (!user) return;

    const colRef = collection(db, "communities", "villa001", "evidences");

    const q = query(
      colRef,
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvidences(list);
      },
      (err) => {
        console.error("❌ 증거 목록 구독 오류:", err);
      }
    );

    return () => unsub();
  }, [user]);

  const pickAndUpload = async (type) => {
    if (!user) {
      Alert.alert("로그인 필요", "증거를 저장하려면 로그인이 필요합니다.");
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("권한 필요", "사진/영상 접근 권한을 허용해주세요.");
      return;
    }

    const mediaTypes = type === "image" ? ["images"] : ["videos"];

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: false,
        quality: 0.8,
      });
    } catch (e) {
      console.error("❌ 이미지 피커 실행 오류:", e);
      Alert.alert("오류", "갤러리를 여는 중 문제가 발생했습니다.");
      return;
    }

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const ext = type === "image" ? "jpg" : "mp4";
      const path = `evidences/${user.uid}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      const colRef = collection(db, "communities", "villa001", "evidences");
      await addDoc(colRef, {
        ownerUid: user.uid,
        type, // "image" or "video"
        url,
        createdAt: serverTimestamp(),
      });

      Alert.alert("저장 완료", "증거 자료가 안전하게 저장되었습니다.");
    } catch (e) {
      console.error("❌ 업로드 오류:", e);
      Alert.alert("업로드 실패", "파일 업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ 이 증거를 채팅으로 전송
  const handleSendToChat = (item) => {
    if (!item?.url || !item?.type) {
      Alert.alert("전송 불가", "증거 정보가 올바르지 않습니다.");
      return;
    }

    navigation.navigate("Chatting", {
      mediaToSend: {
        url: item.url,
        type: item.type, // "image" | "video"
      },
    });
  };

  const renderItem = ({ item }) => {
    const dateText = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleString()
      : "시간 정보 없음";

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemRow}>
          {item.type === "image" ? (
            <Image source={{ uri: item.url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.videoThumb]}>
              <Text style={styles.videoIcon}>🎬</Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.itemType}>
              {item.type === "image" ? "사진 증거" : "영상 증거"}
            </Text>
            <Text style={styles.itemDate}>{dateText}</Text>
          </View>
        </View>

        {/* 🔽 채팅으로 전송 버튼 */}
        <View style={styles.itemFooter}>
          <TouchableOpacity
            style={styles.sendToChatButton}
            onPress={() => handleSendToChat(item)}
          >
            <Text style={styles.sendToChatText}>채팅으로 전송</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator color="#63FF88" size="large" />
          <Text style={{ color: "#999", marginTop: 10 }}>
            사용자 정보를 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton} // ✅ 넓은 터치영역 + 아이콘
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center", marginRight: 40 }}>
          <Text style={styles.headerTitle}>분쟁 증거 보관함</Text>
        </View>
      </View>

      {/* 업로드 버튼 영역 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { marginRight: 10 }]}
          onPress={() => pickAndUpload("image")}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "업로드 중..." : "📷 사진 저장"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4B8BFF" }]}
          onPress={() => pickAndUpload("video")}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "업로드 중..." : "🎬 영상 저장"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 목록 */}
      {evidences.length === 0 ? (
        <View style={{ marginTop: 30 }}>
          <Text style={styles.emptyText}>
            아직 저장된 증거 자료가 없습니다.{"\n"}
            위 버튼을 눌러 사진이나 영상을 보관해 보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={evidences}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },

  buttonRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#63FF88",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },

  itemCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemFooter: {
    marginTop: 10,
    alignItems: "flex-end",
  },

  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#3A3A3C",
  },
  videoThumb: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 26,
    color: "#FFF",
  },
  itemType: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  itemDate: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 4,
  },

  sendToChatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#63FF88",
  },
  sendToChatText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyText: {
    color: "#8E8E93",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
