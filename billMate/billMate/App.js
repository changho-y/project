// App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthAPI } from "./src/features/auth/api";

// Auth 플로우
import LoginScreen from "./src/screens/Login";
import SignupScreen from "./src/screens/Signup";

// 메인 대시보드
import HomeScreen from "./src/screens/Home";
import BillDetail from "./src/screens/BillDetail";
import AssistantScreen from "./src/screens/AssistantScreen";
import MoveSettlementCalculator from "./src/screens/MoveSettlementCalculator";
import ProfileScreen from "./src/screens/Profile";
import Chatting from "./src/screens/Chatting";
import EvidenceScreen from "./src/screens/EvidenceScreen";

// 커뮤니티
import PostListScreen from "./src/screens/PostListScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";
import PostEditorScreen from "./src/screens/PostEditorScreen";

const Stack = createNativeStackNavigator();

// 다크 테마
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#000",
    text: "#fff",
    card: "#000",
    border: "#111",
    primary: "#63FF88",
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Firebase Auth 상태 감지
  useEffect(() => {
    const unsub = AuthAPI.observe((u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub && unsub();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        {user ? (
          <>
            {/* 홈 */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />

            {/* 공과금 상세 */}
            <Stack.Screen
              name="BillDetail"
              component={BillDetail}
              options={{ headerShown: false }}
            />

            {/* AI 비서 */}
            <Stack.Screen
              name="Assistant"
              component={AssistantScreen}
              options={{ title: "AI 관리비 비서" }}
            />

            {/* 채팅 */}
            <Stack.Screen
              name="Chatting"
              component={Chatting}
              options={{ title: "익명 채팅" }}
            />

            {/* 전입/전출 정산 */}
            <Stack.Screen
              name="MoveSettlement"
              component={MoveSettlementCalculator}
              options={{ headerShown: false }}
            />

            {/* 커뮤니티 */}
            <Stack.Screen
              name="PostList"
              component={PostListScreen}
              options={{ headerShown: false }}   // 🔥 여기 수정!
            />
            <Stack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{ title: "게시글" }}
            />
            <Stack.Screen
              name="PostEditor"
              component={PostEditorScreen}
              options={{ title: "글쓰기" }}
            />

            {/* 증거 보관함 */}
            <Stack.Screen
              name="Evidence"
              component={EvidenceScreen}
              options={{ headerShown: false }}
            />

            {/* 프로필 */}
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            {/* Auth 플로우 */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
