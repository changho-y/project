// src/features/auth/firebase.js
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore"; // ✅ Firestore 추가

// ✅ Firebase 콘솔에서 받은 설정값
const firebaseConfig = {
  apiKey: "",
  authDomain: "capstone-design2-app.firebaseapp.com",
  projectId: "capstone-design2-app",
  storageBucket: "capstone-design2-app.firebasestorage.app",
  messagingSenderId: "178850376542",
  appId: "1:178850376542:web:b1aea400e4ec4b932a3dcf",
  measurementId: "G-KLCPLT8859",
};

// ✅ 중복 초기화 방지
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ RN/Expo용 Auth 초기화
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // 이미 초기화된 경우
  auth = getAuth(app);
}

// ✅ Firestore 초기화 (🔥 핵심 추가)
const db = getFirestore(app);

// ✅ 내보내기
export { app, auth, db };
