// src/screens/PostDetailScreen.js
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function PostDetailScreen({ route }) {
  const { post } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.meta}>
        by {post.author || "익명"} · {post.createdAt?.toDate?.().toLocaleString?.() || "날짜 없음"}
      </Text>
      <View style={styles.divider} />
      <Text style={styles.content}>{post.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#FFF", fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  meta: { color: "#8E8E93", fontSize: 13, marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#333", marginBottom: 15 },
  content: { color: "#FFF", fontSize: 16, lineHeight: 24 },
});
