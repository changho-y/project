// src/screens/Signup.js (Login 화면 스타일과 동일 적용)
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../features/auth/firebase";

export default function SignupScreen({ navigation }) {
  const route = useRoute();
  const [email, setEmail] = useState(route.params?.prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.prefillEmail) setEmail(route.params.prefillEmail);
  }, [route.params?.prefillEmail]);

  const handleSignup = async () => {
    const emailTrim = email.trim();

    if (!emailTrim || !password || !confirmPassword) {
      Alert.alert("입력 확인", "이메일, 비밀번호, 비밀번호 확인을 모두 입력하세요.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("비밀번호 규칙", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    try {
      setLoading(true);

      // 가입 여부 선확인
      const methods = await fetchSignInMethodsForEmail(auth, emailTrim);
      if (methods.length > 0) {
        Alert.alert(
          "이미 가입된 이메일",
          "해당 이메일로 이미 가입되어 있습니다. 로그인 페이지로 이동할까요?",
          [
            { text: "취소", style: "cancel" },
            { text: "로그인으로", onPress: () => navigation.replace("Login") },
          ]
        );
        return;
      }

      // 회원가입
      const cred = await createUserWithEmailAndPassword(auth, emailTrim, password);
      console.log("회원가입 성공 uid:", cred.user?.uid);

      Alert.alert("회원가입 완료", "로그인 페이지로 이동합니다.", [
        { text: "확인", onPress: () => navigation.replace("Login") },
      ]);
    } catch (error) {
      console.log("회원가입 실패:", error?.code, error?.message);
      switch (error?.code) {
        case "auth/email-already-in-use":
          Alert.alert("이미 사용 중", "해당 이메일은 이미 사용 중입니다. 로그인으로 이동하세요.");
          break;
        case "auth/invalid-email":
          Alert.alert("이메일 형식 오류", "유효한 이메일을 입력하세요.");
          break;
        case "auth/weak-password":
          Alert.alert("비밀번호 약함", "조금 더 복잡한 비밀번호를 사용해 주세요(6자 이상 권장).");
          break;
        default:
          Alert.alert("회원가입 실패", error?.message || "잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 1. 타이틀 */}
        <Text style={styles.appTitle}>BillMate</Text>

        {/* 2. 섹션 타이틀 */}
        <Text style={styles.sectionTitle}>회원가입</Text>

        {/* 3. 입력 필드 */}
        <TextInput
          style={styles.input}
          placeholder="email@domain.com"
          placeholderTextColor="#8E8E93"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호(6자 이상)"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSignup}
        />

        {/* 4. 회원가입 버튼 (Primary) */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>회원가입</Text>}
        </TouchableOpacity>

        {/* 5. 로그인으로 이동 (Secondary) */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.secondaryButtonText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>

        {/* 6. 약관/정책 캡션 (로그인 화면과 동일 톤) */}
        <Text style={styles.caption}>
          계속을 클릭하면 당사의 서비스 이용 약관 및 개인정보 처리방침에 동의하는 것으로 간주합니다.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginTop: -100,
    marginBottom: 80,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
  },
  input: {
    height: 50,
    backgroundColor: "#1C1C1E",
    color: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 30,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
  },
  caption: {
    color: "#8E8E93",
    fontSize: 12,
    textAlign: "center",
    marginTop: 50,
    lineHeight: 18,
  },
});
