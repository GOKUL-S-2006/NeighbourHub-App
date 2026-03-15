import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  Alert, StatusBar, Animated, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { getMyIssues, deleteIssue } from "../src/api/issue";
import * as Linking from "expo-linking"; // ✅ add this line

export default function ProfileScreen({ currentUser, onLogout }) {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  console.log("🖥️ ProfileScreen rendered");
  console.log("👤 currentUser received:", currentUser);

  useEffect(() => {
    loadMyIssues();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadMyIssues = async () => {
    try {
      console.log("📡 fetching my issues...");
      const res = await getMyIssues();
      console.log("✅ my issues:", res);
      setIssues(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.log("❌ getMyIssues error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (issueId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIssue(issueId);
              setIssues(prev => prev.filter(i => i._id !== issueId));
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            await AsyncStorage.removeItem("token");
          } catch (e) {}
          onLogout?.();
          router.replace("/");
        }
      },
    ]);
  };

  const statusColor = (status) => {
    switch (status) {
      case "open": return { bg: "#dcfce7", text: "#16a34a" };
      case "in-progress": return { bg: "#fef9c3", text: "#ca8a04" };
      case "resolved": return { bg: "#dbeafe", text: "#2563eb" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const renderIssue = ({ item }) => {
    const color = statusColor(item.status);
    return (
      <Animated.View style={[styles.postCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        ) : (
          <View style={styles.postImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#d1d5db" />
          </View>
        )}

        <View style={styles.postBody}>
          <View style={styles.postTopRow}>
            <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
              <Text style={[styles.statusText, { color: color.text }]}>
                {item.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.postDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.postMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-up-circle" size={15} color="#16a34a" />
              <Text style={styles.metaText}>{item.votes} votes</Text>
            </View>
            {item.location && (
  <TouchableOpacity
    style={styles.metaItem}
    onPress={() => {
      const url = `https://www.google.com/maps/search/?api=1&query=${item.location}`;
      Linking.openURL(url);
    }}
  >
    <MaterialIcons name="location-on" size={15} color="#2563eb" />
    <Text style={[styles.metaText, { color: "#2563eb", fontWeight: "600" }]} numberOfLines={1}>
      View Location
    </Text>
  </TouchableOpacity>
)}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item._id)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Profile Hero */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{currentUser?.name || "User"}</Text>
          <Text style={styles.userEmail}>{currentUser?.email || ""}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{issues.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {issues.reduce((acc, i) => acc + (i.votes || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Votes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {issues.filter(i => i.status === "resolved").length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </Animated.View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>My Posts</Text>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : issues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubText}>Issues you report will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={issues}
              keyExtractor={item => item._id}
              renderItem={renderIssue}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  heroSection: {
    backgroundColor: "#1e293b",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarRing: {
    width: 88, height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#3b82f6",
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 78, height: 78,
    borderRadius: 39,
    backgroundColor: "#3b82f6",
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "#94a3b8", marginBottom: 20 },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    marginHorizontal: 24,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },

  postsSection: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b", marginBottom: 14 },

  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  postImage: { width: 90, height: 90 },
  postImagePlaceholder: {
    width: 90, height: 90,
    backgroundColor: "#f1f5f9",
    justifyContent: "center", alignItems: "center",
  },
  postBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  postTopRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 4
  },
  postTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "700" },
  postDesc: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: "#6b7280" },

  deleteBtn: {
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#f1f5f9",
  },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#9ca3af", marginTop: 12 },
  emptySubText: { fontSize: 13, color: "#d1d5db", marginTop: 4 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#fee2e2",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});