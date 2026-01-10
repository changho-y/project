// src/screens/Login.js (Figma 디자인 반영)
import React, { useState } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    KeyboardAvoidingView, // 키보드 대응
    Platform,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../features/auth/firebase";

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("입력 확인", "이메일과 비밀번호를 모두 입력하세요.");
            return;
        }
        setLoading(true);
        // ⚡ 참고: Spring Boot 백엔드 연동 시, 이 Firebase 코드를 
        // 젬의 API 호출 코드로 대체해야 합니다. (예: axios.post('/api/login', { email, password }))
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            
            // 로그인 성공 시 바로 홈으로 이동 (App.js의 인증 감지 로직에 의존)
            Alert.alert("로그인 성공", "환영합니다!", [
                { text: "확인" } // App.js에서 인증 상태가 바뀌면 자동으로 화면이 전환됩니다.
            ]);
            console.log("로그인 성공:", userCredential.user?.uid);
        } catch (error) {
            console.error("로그인 실패:", error);
            Alert.alert("로그인 실패", "이메일 또는 비밀번호를 다시 확인하세요.");
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

                {/* 2. 로그인 섹션 타이틀 */}
                <Text style={styles.sectionTitle}>로그인</Text>

                {/* 3. 입력 필드 */}
                <TextInput
                    style={styles.input}
                    placeholder="email@domain.com"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    textContentType="emailAddress"
                />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    textContentType="password"
                />

                {/* 4. 계속 버튼 */}
                <TouchableOpacity 
                    style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                    onPress={handleLogin} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.primaryButtonText}>계속</Text>
                    )}
                </TouchableOpacity>

                {/* 5. 회원가입 버튼 */}
                <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={() => navigation.navigate("Signup")} // 'Signup' 화면으로 이동
                >
                    <Text style={styles.secondaryButtonText}>
                        아직 계정이 없나요? 회원가입
                    </Text>
                </TouchableOpacity>

                {/* 6. 약관/정책 캡션 */}
                <Text style={styles.caption}>
                    계속을 클릭하면 당사의 서비스 이용 약관 및 개인정보 처리방침에
                    동의하는 것으로 간주합니다.
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // Figma 다크 모드 배경
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    appTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#FFF",
        textAlign: "center",
        // 상단 노치 영역을 피해 중앙에 가깝게 배치하기 위해 마진 조정
        marginTop: -100, 
        marginBottom: 80, 
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
    },
    input: {
        height: 50,
        backgroundColor: "#1C1C1E", // Input 배경
        color: "#FFF",
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    // '계속' (Primary) 버튼 스타일 - Figma에서는 흰색 배경에 검은색 텍스트
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
    // '회원가입' (Secondary) 버튼 스타일
    secondaryButton: {
        marginTop: 30,
        paddingVertical: 10,
        // Figma 디자인에서는 텍스트만 보이게 처리
    },
    secondaryButtonText: {
        color: "#FFF",
        fontSize: 16,
        textAlign: "center",
        // Figma에서는 밑줄 없음, 터치 영역만 넓게 처리
    },
    caption: {
        color: "#8E8E93",
        fontSize: 12,
        textAlign: "center",
        marginTop: 50,
        lineHeight: 18,
    },
    // 기존 로고/타이틀 스타일은 Figma 디자인에 맞춰 제거했습니다.
});