import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRef } from "react";

const STATUS_CONFIG = {
  open:          { bg: "#dcfce7", text: "#15803d", label: "Open",        icon: "radio-button-on" },
  "in-progress": { bg: "#fef9c3", text: "#a16207", label: "In Progress", icon: "time" },
  resolved:      { bg: "#dbeafe", text: "#1d4ed8", label: "Resolved",    icon: "checkmark-circle" },
};

const SEVERITY_CONFIG = {
  Low:       { bar: "#16a34a", bg: "#EAF3DE", text: "#27500A", dot: "#16a34a",  border: null },
  Medium:    { bar: "#ca8a04", bg: "#FAEEDA", text: "#633806", dot: "#ca8a04",  border: null },
  High:      { bar: "#e11d48", bg: "#FCEBEB", text: "#791F1F", dot: "#e11d48",  border: "#e11d48" },
  Emergency: { bar: "#A32D2D", bg: "#A32D2D", text: "#F7C1C1", dot: "#F7C1C1", border: "#A32D2D" },
};

const CATEGORY_ICONS = {
  road:        "car-outline",
  water:       "water-outline",
  electricity: "flash-outline",
  sanitation:  "trash-outline",
  safety:      "shield-outline",
  noise:       "volume-high-outline",
  general:     "alert-circle-outline",
  other:       "ellipsis-horizontal-circle-outline",
};

export default function IssueCard({ issue, currentUserId, onMapPress, onUpvote }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleUpvotePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onUpvote(issue);
  };

  const hasUpvoted   = issue.votedBy?.map(id => id.toString()).includes(currentUserId?.toString());
  const statusCfg    = STATUS_CONFIG[issue.status]    || STATUS_CONFIG.open;
  const severityCfg  = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Low;
  const categoryIcon = CATEGORY_ICONS[issue.category]  || "alert-circle-outline";
  const isEmergency  = issue.severity === "Emergency";
  const isHigh       = issue.severity === "High";

  return (
    <View style={[
      styles.card,
      isHigh      && styles.cardHighBorder,
      isEmergency && styles.cardEmergencyBorder,
    ]}>

      {/* ── Emergency banner ── */}
      {isEmergency && (
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyDot} />
          <Text style={styles.emergencyBannerText}>EMERGENCY — Immediate attention required</Text>
        </View>
      )}

      {/* ── Severity color bar ── */}
      <View style={[styles.severityBar, { backgroundColor: severityCfg.bar }]} />

      {/* ── Image ── */}
      {issue.image && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: issue.image }} style={styles.image} />
          <View style={styles.categoryPill}>
            <Ionicons name={categoryIcon} size={12} color="#fff" />
            <Text style={styles.categoryPillText}>
              {issue.category ? issue.category.charAt(0).toUpperCase() + issue.category.slice(1) : "General"}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.body}>

        {/* ── Badges row ── */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={11} color={statusCfg.text} />
            <Text style={[styles.badgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>

          {issue.severity && (
            <View style={[styles.badge, { backgroundColor: severityCfg.bg }]}>
              <View style={[styles.severityDot, { backgroundColor: severityCfg.dot }]} />
              <Text style={[styles.badgeText, { color: severityCfg.text }]}>{issue.severity}</Text>
            </View>
          )}

          {!issue.image && (
            <View style={styles.categoryBadge}>
              <Ionicons name={categoryIcon} size={12} color="#64748b" />
              <Text style={styles.categoryBadgeText}>
                {issue.category ? issue.category.charAt(0).toUpperCase() + issue.category.slice(1) : "General"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Title ── */}
        <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>

        {/* ── Description ── */}
        {issue.description ? (
          <Text style={styles.description} numberOfLines={3}>{issue.description}</Text>
        ) : null}

        <View style={styles.divider} />

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleUpvotePress} style={styles.upvoteBtn} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={hasUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
                size={26}
                color={hasUpvoted ? "#16a34a" : "#94a3b8"}
              />
            </Animated.View>
            <Text style={[styles.votesText, { color: hasUpvoted ? "#16a34a" : "#64748b" }]}>
              {issue.votes ?? 0}
            </Text>
          </TouchableOpacity>

          {issue.location && (
            <TouchableOpacity style={styles.locationBtn} onPress={() => onMapPress(issue.location)} activeOpacity={0.8}>
              <MaterialIcons name="location-on" size={15} color="#1d4ed8" />
              <Text style={styles.locationText}>View on map</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  cardHighBorder:      { borderWidth: 2, borderColor: "#e11d48" },
  cardEmergencyBorder: { borderWidth: 2, borderColor: "#A32D2D" },

  // Emergency banner
  emergencyBanner: {
    backgroundColor: "#A32D2D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
  },
  emergencyDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#F7C1C1",
  },
  emergencyBannerText: {
    fontSize: 11, fontWeight: "800",
    color: "#F7C1C1", letterSpacing: 0.3,
  },

  // Severity bar
  severityBar: { height: 5, width: "100%" },

  // Image
  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 190 },
  categoryPill: {
    position: "absolute", bottom: 10, left: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  categoryPillText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // Body
  body: { padding: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" },

  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  severityDot: { width: 6, height: 6, borderRadius: 3 },

  categoryBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", color: "#64748b" },

  title: {
    fontSize: 16, fontWeight: "800",
    color: "#0f172a", lineHeight: 22, marginBottom: 6,
  },
  description: {
    fontSize: 13, color: "#64748b",
    lineHeight: 20, marginBottom: 2,
  },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  votesText: { fontSize: 14, fontWeight: "800" },

  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  locationText: { fontSize: 12, fontWeight: "700", color: "#1d4ed8" },
});