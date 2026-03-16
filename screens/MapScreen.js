import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import MapView, { Marker, Circle, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getIssues } from "../src/api/issue";

const CATEGORY_COLORS = {
  road:        "#e11d48",
  water:       "#2563eb",
  electricity: "#f59e0b",
  sanitation:  "#16a34a",
  safety:      "#7c3aed",
  noise:       "#f97316",
  general:     "#64748b",
  other:       "#64748b",
};

const SEVERITY_RADIUS = {
  Emergency: 120,
  High:       90,
  Medium:     60,
  Low:        40,
};

const SEVERITY_OPACITY = {
  Emergency: 0.35,
  High:      0.25,
  Medium:    0.18,
  Low:       0.12,
};

const FILTERS = ["all", "road", "water", "electricity", "sanitation", "safety", "noise"];

export default function MapScreen() {
  const router = useRouter();
  const [issues, setIssues]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [userCoords, setUserCoords]     = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showStats, setShowStats]       = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await getIssues();
      setIssues(res.data || []);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserCoords({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (err) {
      console.log("Map load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseLocation = (locationStr) => {
    if (!locationStr) return null;
    const parts = locationStr.split(",").map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return { latitude: parts[0], longitude: parts[1] };
  };

  const validIssues    = issues.filter(i => parseLocation(i.location));
  const filteredIssues = activeFilter === "all"
    ? validIssues
    : validIssues.filter(i => i.category === activeFilter);

  const getInitialRegion = () => {
    if (userCoords) return {
      latitude: userCoords.latitude, longitude: userCoords.longitude,
      latitudeDelta: 0.05, longitudeDelta: 0.05,
    };
    if (validIssues.length > 0) {
      const c = parseLocation(validIssues[0].location);
      return { latitude: c.latitude, longitude: c.longitude,
               latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    return { latitude: 13.0827, longitude: 80.2707,
             latitudeDelta: 0.05, longitudeDelta: 0.05 };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      road: "car", water: "water", electricity: "flash",
      sanitation: "trash", safety: "shield", noise: "volume-high",
      general: "alert-circle", other: "ellipsis-horizontal-circle"
    };
    return icons[category] || "alert-circle";
  };

  // ─── STATS computed from all issues ───────────────────
  const stats = {
    total:      validIssues.length,
    open:       validIssues.filter(i => i.status === "open").length,
    resolved:   validIssues.filter(i => i.status === "resolved").length,
    emergency:  validIssues.filter(i => i.severity === "Emergency").length,
    high:       validIssues.filter(i => i.severity === "High").length,
    totalVotes: validIssues.reduce((a, i) => a + (i.votes || 0), 0),
    resRate:    validIssues.length > 0
      ? Math.round((validIssues.filter(i => i.status === "resolved").length
          / validIssues.length) * 100)
      : 0,
    // most reported category
    topCategory: (() => {
      const count = {};
      validIssues.forEach(i => { count[i.category] = (count[i.category] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
      return top ? `${top[0]} (${top[1]})` : "none";
    })(),
    // category breakdown
    categoryBreakdown: (() => {
      const count = {};
      validIssues.forEach(i => { count[i.category] = (count[i.category] || 0) + 1; });
      return Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    })(),
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Problem Intensity Map</Text>
          <Text style={styles.headerSub}>{filteredIssues.length} issues plotted</Text>
        </View>
        {/* Stats toggle button */}
        <TouchableOpacity
          style={[styles.statsToggleBtn, showStats && styles.statsToggleBtnActive]}
          onPress={() => setShowStats(!showStats)}
        >
          <Ionicons name="bar-chart" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              activeFilter === f && {
                backgroundColor: CATEGORY_COLORS[f] || "#1e293b",
                borderColor: CATEGORY_COLORS[f] || "#1e293b"
              }
            ]}
            onPress={() => setActiveFilter(f)}
          >
            {f !== "all" && (
              <Ionicons
                name={getCategoryIcon(f)}
                size={11}
                color={activeFilter === f ? "#fff" : "#64748b"}
              />
            )}
            <Text style={[
              styles.filterChipText,
              activeFilter === f && { color: "#fff" }
            ]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            initialRegion={getInitialRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {filteredIssues.map(issue => {
              const coords  = parseLocation(issue.location);
              const color   = CATEGORY_COLORS[issue.category] || "#64748b";
              const radius  = SEVERITY_RADIUS[issue.severity]  || 60;
              const opacity = SEVERITY_OPACITY[issue.severity] || 0.18;
              const hexOpacity = Math.round(opacity * 255)
                .toString(16).padStart(2, "0");

              return (
                <View key={issue._id}>
                  {/* Intensity circle */}
                  <Circle
                    center={coords}
                    radius={radius}
                    fillColor={color + hexOpacity}
                    strokeColor={color}
                    strokeWidth={1}
                  />
                  {/* Pin marker */}
                  <Marker coordinate={coords}>
                    <View style={[styles.markerPin, { backgroundColor: color }]}>
                      <Ionicons name={getCategoryIcon(issue.category)} size={14} color="#fff" />
                    </View>
                    <Callout style={styles.callout}>
                      <View style={styles.calloutInner}>
                        <Text style={styles.calloutTitle} numberOfLines={2}>
                          {issue.title}
                        </Text>
                        <View style={styles.calloutRow}>
                          <View style={[styles.calloutBadge,
                            { backgroundColor: color + "22" }]}>
                            <Text style={[styles.calloutBadgeText, { color }]}>
                              {issue.category}
                            </Text>
                          </View>
                          <View style={styles.calloutBadge}>
                            <Text style={styles.calloutBadgeText}>
                              {issue.severity}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.calloutStatus}>
                          {issue.status?.toUpperCase()} · {issue.votes} votes
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                </View>
              );
            })}
          </MapView>

          {/* ── Stats Overlay Panel ── */}
          {showStats && (
            <View style={styles.statsOverlay}>
              <View style={styles.statsHeader}>
                <Text style={styles.statsTitle}>Neighbourhood Stats</Text>
                <TouchableOpacity onPress={() => setShowStats(false)}>
                  <Ionicons name="close" size={18} color="#1e293b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Top stat cards */}
                <View style={styles.statGrid}>
                  <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}>
                    <Text style={[styles.statNum, { color: "#1d4ed8" }]}>{stats.total}</Text>
                    <Text style={[styles.statLabel, { color: "#1d4ed8" }]}>Total Issues</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
                    <Text style={[styles.statNum, { color: "#15803d" }]}>{stats.resRate}%</Text>
                    <Text style={[styles.statLabel, { color: "#15803d" }]}>Resolved</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: "#fee2e2" }]}>
                    <Text style={[styles.statNum, { color: "#dc2626" }]}>{stats.emergency}</Text>
                    <Text style={[styles.statLabel, { color: "#dc2626" }]}>Emergency</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: "#fef9c3" }]}>
                    <Text style={[styles.statNum, { color: "#ca8a04" }]}>{stats.totalVotes}</Text>
                    <Text style={[styles.statLabel, { color: "#ca8a04" }]}>Total Votes</Text>
                  </View>
                </View>

                {/* Status breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Status Breakdown</Text>
                  <View style={styles.breakdownBar}>
                    {stats.total > 0 && (
                      <>
                        <View style={{
                          flex: stats.open || 0.01,
                          backgroundColor: "#16a34a",
                          height: 10
                        }} />
                        <View style={{
                          flex: (stats.total - stats.open - stats.resolved) || 0.01,
                          backgroundColor: "#ca8a04",
                          height: 10
                        }} />
                        <View style={{
                          flex: stats.resolved || 0.01,
                          backgroundColor: "#2563eb",
                          height: 10
                        }} />
                      </>
                    )}
                  </View>
                  <View style={styles.breakdownLegend}>
                    {[
                      { color: "#16a34a", label: `Open (${stats.open})` },
                      { color: "#ca8a04", label: `In Progress` },
                      { color: "#2563eb", label: `Resolved (${stats.resolved})` },
                    ].map(l => (
                      <View key={l.label} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                        <Text style={styles.legendText}>{l.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Category breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Top Categories</Text>
                  {stats.categoryBreakdown.map(([cat, count]) => (
                    <View key={cat} style={styles.catRow}>
                      <View style={styles.catLeft}>
                        <View style={[styles.catDot,
                          { backgroundColor: CATEGORY_COLORS[cat] || "#64748b" }]} />
                        <Text style={styles.catName}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.catBarWrap}>
                        <View style={[styles.catBar, {
                          width: `${Math.round((count / stats.total) * 100)}%`,
                          backgroundColor: CATEGORY_COLORS[cat] || "#64748b"
                        }]} />
                      </View>
                      <Text style={styles.catCount}>{count}</Text>
                    </View>
                  ))}
                </View>

                {/* High urgency issues */}
                {stats.emergency > 0 && (
                  <View style={styles.urgentSection}>
                    <View style={styles.urgentHeader}>
                      <Ionicons name="alert-circle" size={16} color="#dc2626" />
                      <Text style={styles.urgentTitle}>
                        {stats.emergency} Emergency {stats.emergency === 1 ? "issue" : "issues"} active
                      </Text>
                    </View>
                    {validIssues
                      .filter(i => i.severity === "Emergency")
                      .slice(0, 3)
                      .map(i => (
                        <Text key={i._id} style={styles.urgentItem} numberOfLines={1}>
                          • {i.title}
                        </Text>
                      ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Circle size = severity intensity</Text>
            <View style={styles.legendRow}>
              {[
                { color: "#e11d48", label: "Road" },
                { color: "#2563eb", label: "Water" },
                { color: "#f59e0b", label: "Electric" },
                { color: "#16a34a", label: "Sanitation" },
                { color: "#7c3aed", label: "Safety" },
              ].map(l => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={styles.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#1e293b",
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },
  headerSub:   { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 2 },
  statsToggleBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  statsToggleBtnActive: { backgroundColor: "#2563eb" },

  filterContainer: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, paddingVertical: 8, gap: 6,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: "#f1f5f9",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  filterChipText: { fontSize: 11, fontWeight: "600", color: "#64748b" },

  map: { flex: 1 },

  loadingState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText:  { fontSize: 14, color: "#64748b" },

  markerPin: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  callout:      { width: 200 },
  calloutInner: { padding: 8 },
  calloutTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 6 },
  calloutRow:   { flexDirection: "row", gap: 6, marginBottom: 4 },
  calloutBadge: {
    backgroundColor: "#f1f5f9", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  calloutBadgeText: { fontSize: 10, fontWeight: "700", color: "#64748b" },
  calloutStatus:    { fontSize: 11, color: "#94a3b8" },

  // Stats overlay
  statsOverlay: {
    position: "absolute", bottom: 70,
    left: 12, right: 12,
    backgroundColor: "#fff", borderRadius: 20,
    padding: 16, maxHeight: 420,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  statsHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  statsTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },

  statGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 10, alignItems: "center",
  },
  statNum:   { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },

  breakdownSection: { marginBottom: 14 },
  breakdownTitle: {
    fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8
  },
  breakdownBar: {
    flexDirection: "row", height: 10,
    borderRadius: 5, overflow: "hidden", marginBottom: 8,
  },
  breakdownLegend: { flexDirection: "row", gap: 12, flexWrap: "wrap" },

  catRow: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginBottom: 6,
  },
  catLeft:    { flexDirection: "row", alignItems: "center", gap: 6, width: 90 },
  catDot:     { width: 8, height: 8, borderRadius: 4 },
  catName:    { fontSize: 12, color: "#1e293b", fontWeight: "600" },
  catBarWrap: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  catBar:     { height: 8, borderRadius: 4 },
  catCount:   { fontSize: 12, fontWeight: "700", color: "#64748b", width: 20, textAlign: "right" },

  urgentSection: {
    backgroundColor: "#fee2e2", borderRadius: 12, padding: 12, marginBottom: 8,
  },
  urgentHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  urgentTitle:  { fontSize: 13, fontWeight: "700", color: "#dc2626" },
  urgentItem:   { fontSize: 12, color: "#7f1d1d", marginBottom: 2 },

  legend: {
    backgroundColor: "#fff", padding: 10,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  legendTitle: { fontSize: 10, fontWeight: "600", color: "#94a3b8", marginBottom: 6 },
  legendRow:   { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: 11, color: "#64748b" },
});