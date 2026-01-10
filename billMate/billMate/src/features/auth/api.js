// src/features/auth/api.js
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const AuthAPI = {
  // Firebase Auth 관찰 (로그인 상태 변경 감지)
  observe: (cb) => onAuthStateChanged(auth, cb),

  // 로그인
  login: (email, pw) => signInWithEmailAndPassword(auth, email, pw),

  // 회원가입 (여기서는 Firestore 문서 생성까지는 안 함 – 주소 저장 시 생성됨)
  signup: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),

  // 비밀번호 재설정
  reset: (email) => sendPasswordResetEmail(auth, email),

  // 로그아웃
  signOut: () => signOut(auth),

  // 🔹 Firestore에 사용자 정보 저장 (merge: true → 기존 필드 유지 + 덮어쓰기)
  updateUser: async (uid, data) => {
    const ref = doc(db, "users", uid);
    await setDoc(ref, data, { merge: true });
  },

  // 🔹 Firestore에서 사용자 정보 불러오기
  getUser: async (uid) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },
};