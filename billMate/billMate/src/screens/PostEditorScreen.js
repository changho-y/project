// src/screens/PostEditorScreen.js
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../features/auth/firebase";

export default function PostEditorScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("입력 오류", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, "community"), {
        title,
        content,
        author: "익명",
        createdAt: serverTimestamp(),
      });
      Alert.alert("성공", "게시글이 등록되었습니다!");
      navigation.goBack();
    } catch (err) {
      console.error("❌ 게시글 업로드 오류:", err);
      Alert.alert("오류", "게시글 등록 중 문제가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✏️ 새 글 작성</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="제목을 입력하세요"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.contentInput}
        placeholder="내용을 입력하세요"
        placeholderTextColor="#888"
        value={content}
        onChangeText={setContent}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handlePost}>
        <Text style={styles.buttonText}>등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#FFF", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  titleInput: {
    backgroundColor: "#1C1C1E",
    color: "#FFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  contentInput: {
    backgroundColor: "#1C1C1E",
    color: "#FFF",
    borderRadius: 8,
    padding: 12,
    height: 200,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#63FF88",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#000", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});
