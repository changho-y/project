// src/screens/Profile.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthAPI } from "../features/auth/api";
import Postcode from "react-native-daum-postcode";
/**
 * 주소 편집 모달 컴포넌트
 * - Daum 주소검색 + 상세주소 입력
 * - 저장 버튼은 부모에서 넘겨주는 onSave 호출
 */
function AddressEditorModal({ visible, onClose, address, onChange, onSave }) {
  const handleAddressSelect = (data) => {
    const next = {
      zipCode: data.zonecode,
      roadAddress: data.roadAddress || data.jibunAddress || "",
      detailAddress: address?.detailAddress || "",
    };
    onChange(next);
  };

  const handleDetailChange = (text) => {
    onChange({
      ...address,
      detailAddress: text,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* 모달 헤더 */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>집 주소 등록</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>닫기</Text>
          </TouchableOpacity>
        </View>

        {/* 주소 검색 + 입력 영역 */}
        <ScrollView style={{ paddingHorizontal: 20 }}>
          <Text style={styles.modalLabel}>우편번호</Text>
          <View style={styles.zipRow}>
            <TextInput
              style={[styles.input, styles.zipInput]}
              placeholder="우편번호"
              value={address?.zipCode || ""}
              editable={false}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <Text style={styles.modalLabel}>기본 주소</Text>
          <TextInput
            style={styles.input}
            placeholder="우편번호 검색으로 불러옵니다"
            value={address?.roadAddress || ""}
            editable={false}
            placeholderTextColor="#8E8E93"
          />

          <Text style={styles.modalLabel}>상세 주소</Text>
          <TextInput
            style={styles.input}
            placeholder="상세 주소를 입력하세요 (동/호수 등)"
            value={address?.detailAddress || ""}
            onChangeText={handleDetailChange}
            placeholderTextColor="#8E8E93"
          />

          {/* 주소 검색 뷰 */}
          <View style={{ height: 320, marginTop: 20 }}>
            <Text style={styles.modalLabel}>주소 검색</Text>
            <View style={styles.postcodeBox}>
              <Postcode
                style={{ flex: 1 }}
                jsOptions={{ animation: true }}
                onSelected={handleAddressSelect}
                onError={(err) => {
                  console.warn("Postcode error", err);
                }}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveAddressButton} onPress={onSave}>
            <Text style={styles.saveAddressText}>주소 저장</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  // 주소 상태 (Firestore에 저장될 구조)
  const [profileAddress, setProfileAddress] = useState({
    zipCode: "",
    roadAddress: "",
    detailAddress: "",
  });

  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // Auth 상태 관찰
  useEffect(() => {
    const unsub = AuthAPI.observe((u) => {
      setUser(u);
    });
    return () => unsub && unsub();
  }, []);

  // Firestore에서 사용자 정보(주소) 가져오기
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    (async () => {
      try {
        const data = await AuthAPI.getUser(user.uid);
        if (!mounted) return;

        if (data?.address && typeof data.address === "object") {
          setProfileAddress({
            zipCode: data.address.zipCode || "",
            roadAddress: data.address.roadAddress || "",
            detailAddress: data.address.detailAddress || "",
          });
        } else if (typeof data?.address === "string") {
          // 예전에 문자열로만 저장했을 가능성 대비
          setProfileAddress((prev) => ({
            ...prev,
            roadAddress: data.address,
          }));
        }
      } catch (e) {
        console.log("사용자 Firestore 정보 불러오기 오류:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", marginTop: 50, textAlign: "center" }}>
          사용자 정보를 불러오는 중...
        </Text>
      </SafeAreaView>
    );
  }

  const email = user.email;

  const prettyAddress = profileAddress.roadAddress
    ? `${profileAddress.roadAddress} ${profileAddress.detailAddress || ""}`.trim()
    : "집 주소를 등록해 주세요";

  const handleLogout = async () => {
    try {
      await AuthAPI.signOut();
    } catch (err) {
      console.log("로그아웃 오류:", err);
    }
  };

  // 주소 저장 → Firestore 업데이트
  const handleSaveAddress = async () => {
    if (!user) return;
    try {
      await AuthAPI.updateUser(user.uid, {
        address: profileAddress,
      });
      setAddressModalVisible(false);
    } catch (e) {
      console.log("주소 저장 오류:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center", marginRight: 30 }}>
            <Text style={styles.headerTitle}>내 프로필</Text>
          </View>
        </View>

        {/* 임시 프로필 사진 (아바타) */}
        <View style={styles.avatarWrapper}>
          <View style={styles.bigAvatar} />
        </View>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>계정 정보</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          <View style={styles.separator} />

          {/* 주소 + 수정 버튼 */}
          <View
            style={[
              styles.infoRow,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.infoLabel}>집 주소</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {prettyAddress}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editAddressButton}
              onPress={() => setAddressModalVisible(true)}
            >
              <Text style={styles.editAddressText}>수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로그아웃 */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            BillMate는 세입자와 집주인의 공과금 관리를 도와주는 주거 관리 앱입니다.
          </Text>
        </View>
      </ScrollView>

      {/* 주소 편집 모달 */}
      <AddressEditorModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        address={profileAddress}
        onChange={setProfileAddress}
        onSave={handleSaveAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  scrollView: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },

  headerIcon: {
    color: "#FFF",
    fontSize: 22,
  },

  /* 임시 프로필 아바타 */
  avatarWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  bigAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#8E8E93",
  },

  profileCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  infoRow: { marginVertical: 6 },

  infoLabel: {
    color: "#9A9AA0",
    fontSize: 13,
    marginBottom: 4,
  },

  infoValue: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },

  separator: {
    height: 1,
    backgroundColor: "#3A3A3C",
    marginVertical: 10,
  },

  footer: { marginTop: 30, marginBottom: 40 },

  logoutButton: {
    backgroundColor: "#63FF88",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },

  footerHint: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },

  /* 모달 / 주소 입력 스타일 */
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  modalClose: {
    fontSize: 14,
    color: "#63FF88",
  },
  modalLabel: {
    color: "#FFF",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3A3A3C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#FFF",
    backgroundColor: "#1C1C1E",
  },
  zipRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  zipInput: {
    flex: 1,
  },
  postcodeBox: {
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3A3A3C",
    height: 260,
    backgroundColor: "#FFF",
  },
  saveAddressButton: {
    marginTop: 24,
    marginBottom: 30,
    backgroundColor: "#63FF88",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveAddressText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  editAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
  },
  editAddressText: {
    color: "#63FF88",
    fontSize: 13,
    fontWeight: "600",
  },
});
