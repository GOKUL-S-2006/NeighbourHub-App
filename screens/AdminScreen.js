import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, StatusBar, RefreshControl, ScrollView
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

const SEVERITY_SCORE = { Emergency: 4, High: 3, Medium: 2, Low: 1 };

const SEVERITY_BAR_COLORS = {
  Emergency: "#A32D2D", High: "#e11d48",
  Medium: "#ca8a04", Low: "#16a34a",
};

const SORT_OPTIONS = [
  { key: "priority", label: "Priority" },
  { key: "votes",    label: "Most Voted" },
  { key: "newest",   label: "Newest" },
  { key: "oldest",   label: "Oldest" },
];

const ALL_STATUSES = ["open", "in-progress", "resolved"];

export default function AdminScreen({ currentUser }) {
  const router = useRouter();
  const [issues, setIssues]               = useState([]);
  const [stats, setStats]                 = useState(null);
  const [activeFilter, setActiveFilter]   = useState("all");
  const [activeSort, setActiveSort]       = useState("priority");
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadIssues(1); }, [activeFilter]);

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
      const res = await getAdminIssues(pageNum, 50, filters);
      if (pageNum === 1) setIssues(res.data || []);
      else setIssues(prev => [...prev, ...(res.data || [])]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.log("❌ admin issues error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadAll(); };
  const loadMore  = () => { if (page < totalPages) loadIssues(page + 1); };

  // ─── SORT ─────────────────────────────────────────────
  const sortedIssues = [...issues].sort((a, b) => {
    if (activeSort === "priority") {
      const sevA = SEVERITY_SCORE[a.severity] || 0;
      const sevB = SEVERITY_SCORE[b.severity] || 0;
      if (sevB !== sevA) return sevB - sevA;
      return (b.votes || 0) - (a.votes || 0);
    }
    if (activeSort === "votes") {
      return (b.votes || 0) - (a.votes || 0);
    }
    if (activeSort === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (activeSort === "oldest") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    return 0;
  });

  // ─── ANALYTICS ────────────────────────────────────────
  const analytics = stats ? (() => {
    const total    = stats.totalIssues || 0;
    const resolved = stats.resolvedIssues || 0;
    const resRate  = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgPerWeek = Math.round(total / 4);
    const catCount = {};
    issues.forEach(i => { if (i.category) catCount[i.category] = (catCount[i.category] || 0) + 1; });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    const urgentCount = issues.filter(i => i.severity === "Emergency" || i.severity === "High").length;
    const avgVotes = total > 0 ? Math.round((stats.totalVotes || 0) / total) : 0;
    return { resRate, avgPerWeek, topCat, urgentCount, avgVotes };
  })() : null;

  // ─── STATUS CHANGE ────────────────────────────────────
  const handleStatusChange = (issue) => {
    Alert.alert("Update Status", `Change "${issue.title}" to:`, [
      ...ALL_STATUSES
        .filter(s => s !== issue.status)
        .map(s => ({
          text: s.charAt(0).toUpperCase() + s.slice(1),
          onPress: async () => {
            try {
              await adminUpdateStatus(issue._id, s);
              setIssues(prev => prev.map(i => i._id === issue._id ? { ...i, status: s } : i));
              loadStats();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || err.message);
            }
          }
        })),
      { text: "Cancel", style: "cancel" }
    ]);
  };

  // ─── DELETE ───────────────────────────────────────────
  const handleDelete = (issue) => {
    Alert.alert("Delete Issue", `Delete "${issue.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminDeleteIssue(issue._id);
            setIssues(prev => prev.filter(i => i._id !== issue._id));
            loadStats();
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || err.message);
          }
        }
      }
    ]);
  };

  // ─── LOGOUT ───────────────────────────────────────────
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

  // ─── RENDER ISSUE ─────────────────────────────────────
  const renderIssue = ({ item, index }) => {
    if (!item || !item._id) return null;

    const color  = STATUS_COLORS[item.status] || STATUS_COLORS.open;
    const sevBar = SEVERITY_BAR_COLORS[item.severity] || "#16a34a";
    const isTop3 = index < 3 && activeSort === "priority";

    return (
      <View style={[styles.card, isTop3 && styles.cardTop]}>

        {/* Priority rank badge */}
        {isTop3 && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1} Priority</Text>
          </View>
        )}

        {/* Severity bar */}
        <View style={[styles.sevBar, { backgroundColor: sevBar }]} />

        <View style={styles.cardInner}>

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

          {/* Severity + Category tags */}
          <View style={styles.tagRow}>
            {item.severity && (
              <View style={[styles.sevTag, { backgroundColor: sevBar + "22" }]}>
                <View style={[styles.sevDot, { backgroundColor: sevBar }]} />
                <Text style={[styles.sevTagText, { color: sevBar }]}>{item.severity}</Text>
              </View>
            )}
            {item.category && (
              <View style={styles.catTag}>
                <Ionicons name="pricetag-outline" size={11} color="#6b7280" />
                <Text style={styles.catTagText}>{item.category}</Text>
              </View>
            )}
          </View>

          {/* Posted by */}
          {item.createdBy && (
            <View style={styles.postedBy}>
              <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
              <Text style={styles.postedByText}>
                {item.createdBy.name} · {item.createdBy.email}
              </Text>
            </View>
          )}

          {/* Meta row */}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-up-circle" size={14} color="#16a34a" />
              <Text style={styles.metaText}>{item.votes || 0} votes</Text>
            </View>
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
            {item.createdAt && (
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "2-digit"
                })}
              </Text>
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

        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Welcome, {currentUser?.name || "Admin"}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, showAnalytics && styles.iconBtnActive]}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <Ionicons name="bar-chart-outline" size={18} color={showAnalytics ? "#fff" : "#94a3b8"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        {[
          { val: stats?.totalIssues,     label: "Total",    bg: "#1e293b" },
          { val: stats?.openIssues,      label: "Open",     bg: "#16a34a" },
          { val: stats?.inProgressIssues,label: "Progress", bg: "#ca8a04" },
          { val: stats?.resolvedIssues,  label: "Resolved", bg: "#2563eb" },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statNum}>{s.val ?? "-"}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Extra Stats ── */}
      {stats && (
        <View style={styles.extraStats}>
          <View style={styles.extraStatItem}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.extraStatText}>{stats.totalUsers} Users</Text>
          </View>
          <View style={styles.extraStatItem}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="#16a34a" />
            <Text style={styles.extraStatText}>{stats.totalVotes} Votes</Text>
          </View>
        </View>
      )}

      {/* ── FlatList ── */}
      <FlatList
        data={sortedIssues}
        keyExtractor={(item, index) => item?._id || String(index)}
        renderItem={renderIssue}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}

        ListHeaderComponent={
          <View>
            {/* Analytics Panel */}
            {showAnalytics && analytics && (
              <View style={styles.analyticsPanel}>
                <Text style={styles.analyticsPanelTitle}>Community Analytics</Text>

                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsNum}>{analytics.resRate}%</Text>
                    <Text style={styles.analyticsLabel}>Resolution Rate</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, {
                        width: `${analytics.resRate}%`,
                        backgroundColor: "#2563eb"
                      }]} />
                    </View>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsNum}>{analytics.avgPerWeek}</Text>
                    <Text style={styles.analyticsLabel}>Avg Issues / Week</Text>
                    <Text style={styles.analyticsSubtext}>Based on total data</Text>
                  </View>
                </View>

                <View style={styles.analyticsGrid}>
                  <View style={[
                    styles.analyticsCard,
                    analytics.urgentCount > 0 && styles.urgentCard
                  ]}>
                    <Text style={[
                      styles.analyticsNum,
                      { color: analytics.urgentCount > 0 ? "#e11d48" : "#1e293b" }
                    ]}>
                      {analytics.urgentCount}
                    </Text>
                    <Text style={styles.analyticsLabel}>Urgent Issues</Text>
                    <Text style={styles.analyticsSubtext}>High + Emergency</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsNum}>{analytics.avgVotes}</Text>
                    <Text style={styles.analyticsLabel}>Avg Votes / Issue</Text>
                    <Text style={styles.analyticsSubtext}>Community engagement</Text>
                  </View>
                </View>

                {analytics.topCat && (
                  <View style={styles.topCatCard}>
                    <Ionicons name="trophy-outline" size={18} color="#ca8a04" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topCatLabel}>Most Reported Category</Text>
                      <Text style={styles.topCatValue}>
                        {analytics.topCat[0].charAt(0).toUpperCase() + analytics.topCat[0].slice(1)} — {analytics.topCat[1]} issues
                      </Text>
                    </View>
                  </View>
                )}

                {stats && (
                  <View style={styles.breakdownCard}>
                    <Text style={styles.analyticsLabel}>Status Breakdown</Text>
                    <View style={styles.breakdownBar}>
                      {stats.totalIssues > 0 && (
                        <>
                          <View style={[styles.barSeg, { flex: stats.openIssues || 0.01, backgroundColor: "#16a34a" }]} />
                          <View style={[styles.barSeg, { flex: stats.inProgressIssues || 0.01, backgroundColor: "#ca8a04" }]} />
                          <View style={[styles.barSeg, { flex: stats.resolvedIssues || 0.01, backgroundColor: "#2563eb" }]} />
                        </>
                      )}
                    </View>
                    <View style={styles.breakdownLegend}>
                      {[
                        { color: "#16a34a", label: `Open (${stats.openIssues})` },
                        { color: "#ca8a04", label: `Progress (${stats.inProgressIssues})` },
                        { color: "#2563eb", label: `Resolved (${stats.resolvedIssues})` },
                      ].map(l => (
                        <View key={l.label} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                          <Text style={styles.legendText}>{l.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
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

            {/* Sort Options */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SORT_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sortChip, activeSort === s.key && styles.sortChipActive]}
                    onPress={() => setActiveSort(s.key)}
                  >
                    {s.key === "priority" && (
                      <Ionicons
                        name="alert-circle"
                        size={12}
                        color={activeSort === s.key ? "#fff" : "#6b7280"}
                      />
                    )}
                    <Text style={[styles.sortChipText, activeSort === s.key && styles.sortChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading issues...</Text>
              </View>
            )}
          </View>
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No issues here</Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          page < totalPages ? (
            <Text style={styles.loadMoreText}>Loading more...</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#1e293b",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  iconBtnActive: { backgroundColor: "#2563eb" },

  statsRow: {
    flexDirection: "row", paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 16, gap: 8, backgroundColor: "#1e293b",
  },
  statCard:  { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  statNum:   { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  extraStats: {
    flexDirection: "row", justifyContent: "center", gap: 24,
    backgroundColor: "#1e293b", paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  extraStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  extraStatText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  analyticsPanel: {
    margin: 16, marginBottom: 0, backgroundColor: "#fff",
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  analyticsPanelTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b", marginBottom: 14 },
  analyticsGrid:    { flexDirection: "row", gap: 10, marginBottom: 10 },
  analyticsCard:    { flex: 1, backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  urgentCard:       { borderLeftWidth: 3, borderLeftColor: "#e11d48", borderRadius: 12 },
  analyticsNum:     { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 2 },
  analyticsLabel:   { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 4 },
  analyticsSubtext: { fontSize: 10, color: "#94a3b8" },
  progressBg:       { height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, marginTop: 4 },
  progressFill:     { height: 4, borderRadius: 2 },

  topCatCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FAEEDA", borderRadius: 12, padding: 12, marginBottom: 10,
  },
  topCatLabel: { fontSize: 11, color: "#633806", fontWeight: "600" },
  topCatValue: { fontSize: 14, fontWeight: "800", color: "#412402" },

  breakdownCard:   { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  breakdownBar:    { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", marginVertical: 8 },
  barSeg:          { height: 10 },
  breakdownLegend: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  legendItem:      { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },
  legendText:      { fontSize: 11, color: "#64748b" },

  filterRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  filterTab:        { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  filterTabActive:  { backgroundColor: "#1e293b" },
  filterText:       { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  sortRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff", gap: 10,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  sortLabel:          { fontSize: 12, fontWeight: "700", color: "#64748b" },
  sortChip:           { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9", marginRight: 6 },
  sortChipActive:     { backgroundColor: "#1e293b" },
  sortChipText:       { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  sortChipTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff", borderRadius: 16,
    marginHorizontal: 16, marginTop: 12,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 0.5, borderColor: "#e2e8f0",
  },
  cardTop:   { borderWidth: 1.5, borderColor: "#e11d48" },
  rankBadge: { backgroundColor: "#e11d48", paddingHorizontal: 12, paddingVertical: 5 },
  rankText:  { fontSize: 11, fontWeight: "800", color: "#fff" },
  sevBar:    { height: 4, width: "100%" },
  cardInner: { padding: 14 },

  cardTitleRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 6,
  },
  cardTitle:   { fontSize: 15, fontWeight: "700", color: "#1e293b", flex: 1, marginRight: 8 },
  badge:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText:   { fontSize: 10, fontWeight: "700" },
  cardDesc:    { fontSize: 13, color: "#6b7280", lineHeight: 18, marginBottom: 8 },

  tagRow:     { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  sevTag:     { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  sevDot:     { width: 6, height: 6, borderRadius: 3 },
  sevTagText: { fontSize: 11, fontWeight: "700" },
  catTag:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catTagText: { fontSize: 11, color: "#6b7280", fontWeight: "600" },

  postedBy:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  postedByText: { fontSize: 12, color: "#94a3b8" },

  cardMeta: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6b7280" },
  dateText: { fontSize: 11, color: "#94a3b8", marginLeft: "auto" },

  cardActions: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12,
  },
  statusBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, backgroundColor: "#1e293b",
    paddingVertical: 10, borderRadius: 10,
  },
  statusBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  deleteBtn:     { width: 40, height: 40, borderRadius: 10, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },

  emptyState:   { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText:    { fontSize: 15, color: "#9ca3af", marginTop: 12 },
  loadMoreText: { textAlign: "center", color: "#94a3b8", paddingVertical: 12 },
});