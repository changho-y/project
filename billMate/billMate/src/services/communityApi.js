// 커뮤니티 Firestore API (posts, comments)
import { db } from "../features/auth/firebase";
import {
  collection, addDoc, getDocs, getDoc, doc,
  query, orderBy, serverTimestamp, onSnapshot
} from "firebase/firestore";

const COMMUNITY_ID = "villa001";

export async function listPosts() {
  const q = query(
    collection(db, "communities", COMMUNITY_ID, "posts"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPost(postId) {
  const ref = doc(db, "communities", COMMUNITY_ID, "posts", postId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addPost({ title, content, authorNickname }) {
  return addDoc(
    collection(db, "communities", COMMUNITY_ID, "posts"),
    { title, content, authorNickname, createdAt: serverTimestamp() }
  );
}

export function watchComments(postId, cb) {
  const q = query(
    collection(db, "communities", COMMUNITY_ID, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  // 구독: 콜백으로 최신 댓글 배열을 넘겨줌
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addComment(postId, { content, authorNickname }) {
  return addDoc(
    collection(db, "communities", COMMUNITY_ID, "posts", postId, "comments"),
    { content, authorNickname, createdAt: serverTimestamp() }
  );
}
