import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, StatusBar, Animated, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {
  getAdminIssues,
  getAdminStats,
  adminUpdateStatus,
  adminDeleteIssue
} from "../src/api/issue";

const STATUS_COLORS = {
  open:          { bg: "#dcfce7", text: "#16a34a", icon: "radio-button-on" },
  "in-progress": { bg: "#fef9c3", text: "#ca8a04", icon: "time" },
  resolved:      { bg: "#dbeafe", text: "#2563eb", icon: "checkmark-circle" },
};

const ALL_STATUSES = ["open", "in-progress", "resolved"];

export default function AdminScreen({ currentUser }) {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAll();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    loadIssues(1);
  }, [activeFilter]);

  const loadAll = async () => {
    await Promise.all([loadIssues(1), loadStats()]);
  };

  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.log("❌ stats error:", err.response?.data || err.message);
    }
  };

  const loadIssues = async (pageNum = 1) => {
    try {
      const filters = activeFilter !== "all" ? { status: activeFilter } : {};
      const res = await getAdminIssues(pageNum, 10, filters);
     // console.log("✅ admin issues:", res);

      if (pageNum === 1) {
        setIssues(res.data);
      } else {
        setIssues(prev => [...prev, ...res.data]);
      }

      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.log("❌ admin issues error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const loadMore = () => {
    if (page < totalPages) {
      loadIssues(page + 1);
    }
  };

  const handleStatusChange = (issue) => {
    Alert.alert(
      "Update Status",
      `Change "${issue.title}" to:`,
      [
        ...ALL_STATUSES
          .filter(s => s !== issue.status)
          .map(s => ({
            text: s.charAt(0).toUpperCase() + s.slice(1),
            onPress: async () => {
              try {
                await adminUpdateStatus(issue._id, s);
                setIssues(prev =>
                  prev.map(i => i._id === issue._id ? { ...i, status: s } : i)
                );
                loadStats(); // refresh stats after status change
              } catch (err) {
                Alert.alert("Error", err.response?.data?.message || err.message);
              }
            }
          })),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleDelete = (issue) => {
    Alert.alert(
      "Delete Issue",
      `Delete "${issue.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminDeleteIssue(issue._id);
              setIssues(prev => prev.filter(i => i._id !== issue._id));
              loadStats(); // refresh stats after delete
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || err.message);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.removeItem("token");
          router.replace("/");
        }
      }
    ]);
  };

  const renderIssue = ({ item }) => {
    const color = STATUS_COLORS[item.status] || STATUS_COLORS.open;
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {/* Title + Status */}
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Ionicons name={color.icon} size={11} color={color.text} />
            <Text style={[styles.badgeText, { color: color.text }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        {/* Posted by */}
        {item.createdBy && (
          <View style={styles.postedBy}>
            <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
            <Text style={styles.postedByText}>
              {item.createdBy.name} · {item.createdBy.email}
            </Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="arrow-up-circle" size={14} color="#16a34a" />
            <Text style={styles.metaText}>{item.votes} votes</Text>
          </View>
          {item.category && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          )}
          {item.location && (
            <TouchableOpacity
              style={styles.metaItem}
              onPress={() => Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${item.location}`
              )}
            >
              <MaterialIcons name="location-on" size={14} color="#2563eb" />
              <Text style={[styles.metaText, { color: "#2563eb" }]}>Map</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => handleStatusChange(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={15} color="#fff" />
            <Text style={styles.statusBtnText}>Change Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={15} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Welcome, {currentUser?.name || "Admin"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Row — from real backend */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#1e293b" }]}>
          <Text style={styles.statNum}>{stats?.totalIssues ?? "-"}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#16a34a" }]}>
          <Text style={styles.statNum}>{stats?.openIssues ?? "-"}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#ca8a04" }]}>
          <Text style={styles.statNum}>{stats?.inProgressIssues ?? "-"}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#2563eb" }]}>
          <Text style={styles.statNum}>{stats?.resolvedIssues ?? "-"}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Extra stats */}
      {stats && (
        <View style={styles.extraStats}>
          <View style={styles.extraStatItem}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.extraStatText}>{stats.totalUsers} Users</Text>
          </View>
          <View style={styles.extraStatItem}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="#16a34a" />
            <Text style={styles.extraStatText}>{stats.totalVotes} Total Votes</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {["all", "open", "in-progress", "resolved"].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === "all" ? "All" : f === "in-progress" ? "Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Issues List */}
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading issues...</Text>
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No issues here</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={item => item._id}
          renderItem={renderIssue}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            page < totalPages ? (
              <Text style={styles.loadMoreText}>Loading more...</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  logoutIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: "#1e293b",
  },
  statCard: {
    flex: 1, borderRadius: 14,
    paddingVertical: 12, alignItems: "center",
  },
  statNum: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  extraStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    backgroundColor: "#1e293b",
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  extraStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  extraStatText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterTab: {
    flex: 1, paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  filterTabActive: { backgroundColor: "#1e293b" },
  filterText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", flex: 1, marginRight: 8 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: "#6b7280", lineHeight: 18, marginBottom: 8 },

  postedBy: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 8,
  },
  postedByText: { fontSize: 12, color: "#94a3b8" },

  cardMeta: { flexDirection: "row", gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6b7280" },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  statusBtn: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#1e293b",
    paddingVertical: 10, borderRadius: 10,
  },
  statusBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#fee2e2",
    justifyContent: "center", alignItems: "center",
  },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 12 },
  loadMoreText: { textAlign: "center", color: "#94a3b8", paddingVertical: 12 },
});