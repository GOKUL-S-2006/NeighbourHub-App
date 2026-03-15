import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { getIssues, upvoteIssue } from "../src/api/issue";
import { getCurrentUser } from "../src/api/utils/auth";
import IssueCard from "../components/issueCard";

const CATEGORIES = ["all", "road", "water", "electricity", "sanitation", "safety", "noise", "general"];
const STATUSES = ["all", "open", "in-progress", "resolved"];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function Home() {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadIssues();
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadIssues = async () => {
    try {
      const res = await getIssues();
      setIssues(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const openMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location}`;
    Linking.openURL(url);
  };

  const handleNearby = async () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
      return;
    }
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for nearby filter.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setNearbyOnly(true);
    } catch (err) {
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUpvote = async (issue) => {
    const hasVoted = issue.votedBy?.map(id => id.toString()).includes(currentUser?.id);
    const optimisticIssue = {
      ...issue,
      votes: hasVoted ? Math.max(0, issue.votes - 1) : issue.votes + 1,
      votedBy: hasVoted
        ? issue.votedBy.filter(id => id.toString() !== currentUser?.id)
        : [...(issue.votedBy || []), currentUser?.id],
    };
    setIssues(prev => prev.map(i => i._id === issue._id ? optimisticIssue : i));
    try {
      const updated = await upvoteIssue(issue._id);
      setIssues(prev => prev.map(i => i._id === issue._id ? updated : i));
    } catch (err) {
      setIssues(prev => prev.map(i => i._id === issue._id ? issue : i));
      Alert.alert("Failed to upvote ❌", err.response?.data?.message || err.message);
    }
  };

  // ─── FILTERED ISSUES ──────────────────────────────────
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // search by title or description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }

    // filter by category
    if (activeCategory !== "all") {
      result = result.filter(i => i.category === activeCategory);
    }

    // filter by status
    if (activeStatus !== "all") {
      result = result.filter(i => i.status === activeStatus);
    }

    // filter by nearby (within 5km)
    if (nearbyOnly && userCoords) {
      result = result.filter(i => {
        if (!i.location) return false;
        const [lat, lon] = i.location.split(",").map(Number);
        if (isNaN(lat) || isNaN(lon)) return false;
        const dist = getDistance(userCoords.latitude, userCoords.longitude, lat, lon);
        return dist <= 5; // 5km radius
      });
    }

    return result;
  }, [issues, searchQuery, activeCategory, activeStatus, nearbyOnly, userCoords]);

  const activeFilterCount = [
    activeCategory !== "all",
    activeStatus !== "all",
    nearbyOnly,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>NeighbourHub</Text>
          <Text style={styles.subTitle}>Local issues, community fixes</Text>
        </View>

        <View style={styles.headerRight}>
          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => router.push({ pathname: "/admin", params: { user: JSON.stringify(currentUser) } })}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.avatarBubble}
            onPress={() => router.push({ pathname: "/profile", params: { user: JSON.stringify(currentUser) } })}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarInitial}>
              {currentUser?.name?.[0]?.toUpperCase() || "?"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search issues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter toggle */}
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? "#fff" : "#1e293b"} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Nearby toggle */}
          <TouchableOpacity
            style={[styles.nearbyBtn, nearbyOnly && styles.nearbyBtnActive]}
            onPress={handleNearby}
            activeOpacity={0.8}
          >
            {locationLoading ? (
              <Ionicons name="reload-outline" size={15} color={nearbyOnly ? "#fff" : "#2563eb"} />
            ) : (
              <Ionicons name="location" size={15} color={nearbyOnly ? "#fff" : "#2563eb"} />
            )}
            <Text style={[styles.nearbyText, nearbyOnly && styles.nearbyTextActive]}>
              {nearbyOnly ? "📍 Nearby (5km) — ON" : "Show Nearby Only (5km)"}
            </Text>
          </TouchableOpacity>

          {/* Category filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status filter */}
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, activeStatus === s && styles.statusChipActive]}
                onPress={() => setActiveStatus(s)}
              >
                <Text style={[styles.statusChipText, activeStatus === s && styles.statusChipTextActive]}>
                  {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setActiveCategory("all");
                setActiveStatus("all");
                setNearbyOnly(false);
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
              <Text style={styles.clearBtnText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Results count ── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredIssues.length} {filteredIssues.length === 1 ? "issue" : "issues"}
          {searchQuery ? ` for "${searchQuery}"` : ""}
          {nearbyOnly ? " nearby" : ""}
        </Text>
        {(searchQuery || activeFilterCount > 0) && (
          <TouchableOpacity onPress={() => { setSearchQuery(""); setActiveCategory("all"); setActiveStatus("all"); setNearbyOnly(false); }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Issues Feed ── */}
      <FlatList
        data={filteredIssues}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <IssueCard
            issue={item}
            currentUserId={currentUser?.id}
            onMapPress={openMap}
            onUpvote={handleUpvote}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No issues found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create-issue")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingTop: 52 },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16, paddingHorizontal: 4,
  },
  appName: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#dc2626", justifyContent: "center", alignItems: "center",
    shadowColor: "#dc2626", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  avatarBubble: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
    shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  avatarInitial: { fontSize: 17, fontWeight: "800", color: "#fff" },

  // Search
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b", padding: 0 },
  filterBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  filterBtnActive: { backgroundColor: "#1e293b" },
  filterBadge: {
    position: "absolute", top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center",
  },
  filterBadgeText: { fontSize: 10, color: "#fff", fontWeight: "800" },

  // Filters panel
  filtersPanel: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  nearbyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#eff6ff", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 12, borderWidth: 1, borderColor: "#bfdbfe",
  },
  nearbyBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  nearbyText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  nearbyTextActive: { color: "#fff" },

  filterLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 8 },
  chipRow: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#f1f5f9",
    marginRight: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  chipTextActive: { color: "#fff" },

  statusRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statusChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#f1f5f9", alignItems: "center",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  statusChipActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  statusChipText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  statusChipTextActive: { color: "#fff" },

  clearBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 8, marginTop: 4,
  },
  clearBtnText: { fontSize: 13, color: "#ef4444", fontWeight: "600" },

  // Results
  resultsRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 4, marginBottom: 8,
  },
  resultsText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  clearText: { fontSize: 13, color: "#2563eb", fontWeight: "600" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#9ca3af", marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: "#d1d5db", marginTop: 4 },

  // FAB
  fab: {
    position: "absolute", bottom: 30, right: 20,
    backgroundColor: "#2563eb", width: 60, height: 60,
    borderRadius: 30, justifyContent: "center", alignItems: "center",
    elevation: 6, shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
});