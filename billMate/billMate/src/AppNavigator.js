import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PostListScreen from "./screens/PostListScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import PostEditorScreen from "./screens/PostEditorScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle:{ backgroundColor:"#000" }, headerTintColor:"#fff" }}>
      <Stack.Screen name="PostList" component={PostListScreen} options={{ title: "커뮤니티" }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: "게시글" }} />
      <Stack.Screen name="PostEditor" component={PostEditorScreen} options={{ title: "글쓰기" }} />
    </Stack.Navigator>
  );
}
