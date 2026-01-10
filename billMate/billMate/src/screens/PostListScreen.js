// src/screens/PostListScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query, doc } from "firebase/firestore";
import { db } from "../features/auth/firebase";

export default function PostListScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const villaRef = doc(db, "communities", "villa001");
        const postsRef = collection(villaRef, "posts");

        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const postList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setPosts(postList);
      } catch (err) {
        console.error("❌ 게시글 불러오기 오류:", err);
        Alert.alert("데이터 불러오기 실패", "Firestore 구조를 확인해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#63FF88" />
          <Text style={{ color: "#999", marginTop: 10 }}>
            게시글을 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 🔹 공통 스타일 헤더 (뒤로가기 + 제목 + 증거 보관함) */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>🏘️ OO빌라 커뮤니티</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Evidence")}
            style={styles.evidenceBtn}
          >
            <Text style={styles.evidenceText}>증거 보관함</Text>
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <Text style={styles.emptyText}>등록된 게시글이 없습니다.</Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("PostDetail", { post: item })
                }
              >
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  by {item.author || "익명"} ·{" "}
                  {item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleDateString()
                    : "날짜 없음"}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    marginTop: 8,      // 🔹 SafeArea 아래에서 약간만 더 띄움
    marginBottom: 10,
  },

  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  evidenceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#2A2A2C",
    borderRadius: 8,
  },

  evidenceText: {
    color: "#63FF88",
    fontSize: 14,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#1C1C1E",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },

  title: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  meta: { color: "#8E8E93", marginTop: 5, fontSize: 13 },

  emptyText: {
    color: "#8E8E93",
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
