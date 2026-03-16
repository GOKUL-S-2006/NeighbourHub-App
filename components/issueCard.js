import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRef } from "react";

const STATUS_CONFIG = {
  open:          { bg: "#dcfce7", text: "#15803d", label: "Open",        icon: "radio-button-on" },
  "in-progress": { bg: "#fef9c3", text: "#a16207", label: "In Progress", icon: "time" },
  resolved:      { bg: "#dbeafe", text: "#1d4ed8", label: "Resolved",    icon: "checkmark-circle" },
};

const SEVERITY_CONFIG = {
  Low:       { bar: "#16a34a", bg: "#EAF3DE", text: "#27500A", dot: "#16a34a" },
  Medium:    { bar: "#ca8a04", bg: "#FAEEDA", text: "#633806", dot: "#ca8a04" },
  High:      { bar: "#e11d48", bg: "#FCEBEB", text: "#791F1F", dot: "#e11d48" },
  Emergency: { bar: "#A32D2D", bg: "#fee2e2", text: "#7f1d1d", dot: "#A32D2D" },
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
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,   duration: 120, useNativeDriver: true }),
    ]).start();
    onUpvote(issue);
  };

  const hasUpvoted  = issue.votedBy?.map(id => id.toString()).includes(currentUserId?.toString());
  const statusCfg   = STATUS_CONFIG[issue.status]     || STATUS_CONFIG.open;
  const severityCfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Low;
  const catIcon     = CATEGORY_ICONS[issue.category]  || "alert-circle-outline";
  const catLabel    = issue.category
    ? issue.category.charAt(0).toUpperCase() + issue.category.slice(1)
    : "General";

  return (
    <View style={styles.card}>


      {/* Image */}
      {issue.image ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: issue.image }} style={styles.image} />
          {/* Clean glass pills over image */}
          <View style={styles.imageOverlay}>
            <View style={styles.glassPill}>
              <Ionicons name={catIcon} size={12} color="#fff" />
              <Text style={styles.glassPillText}>{catLabel}</Text>
            </View>
            <View style={styles.glassVotePill}>
              <Ionicons name="arrow-up" size={11} color="#fff" />
              <Text style={styles.glassVoteText}>{issue.votes ?? 0}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.noImageBanner, { backgroundColor: severityCfg.bar + "15" }]}>
          <View style={[styles.noImageIcon, { backgroundColor: severityCfg.bar }]}>
            <Ionicons name={catIcon} size={26} color="#fff" />
          </View>
          <View>
            <Text style={[styles.noImageLabel, { color: severityCfg.bar }]}>{catLabel}</Text>
            <Text style={styles.noImageSub}>No photo attached</Text>
          </View>
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={11} color={statusCfg.text} />
            <Text style={[styles.badgeText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>

          {issue.severity && (
            <View style={[styles.badge, { backgroundColor: severityCfg.bg }]}>
              <View style={[styles.dot, { backgroundColor: severityCfg.dot }]} />
              <Text style={[styles.badgeText, { color: severityCfg.text }]}>
                {issue.severity}
              </Text>
            </View>
          )}

          {!issue.image && (
            <View style={styles.catBadge}>
              <Ionicons name={catIcon} size={11} color="#64748b" />
              <Text style={styles.catBadgeText}>{catLabel}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>

        {/* Description */}
        {issue.description ? (
          <Text style={styles.description} numberOfLines={2}>{issue.description}</Text>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>

          {/* Upvote */}
          <TouchableOpacity
            style={styles.upvoteBtn}
            onPress={handleUpvotePress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.upvoteCircle,
                { backgroundColor: hasUpvoted ? "#dcfce7" : "#f1f5f9" },
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Ionicons
                name={hasUpvoted ? "arrow-up" : "arrow-up-outline"}
                size={16}
                color={hasUpvoted ? "#16a34a" : "#94a3b8"}
              />
            </Animated.View>
            <Text style={[
              styles.voteCount,
              { color: hasUpvoted ? "#16a34a" : "#64748b" }
            ]}>
              {issue.votes ?? 0}
            </Text>
          </TouchableOpacity>

          {/* Map button */}
          {issue.location && (
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => onMapPress(issue.location)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="location-on" size={14} color="#1d4ed8" />
              <Text style={styles.mapBtnText}>View on map</Text>
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },

  // Image
  imageWrap:    { position: "relative" },
  image:        { width: "100%", height: 185 },
  imageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "transparent",
  },
  glassPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.25)",
  },
  glassPillText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  glassVotePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.25)",
  },
  glassVoteText: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // No image banner
  noImageBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16,
  },
  noImageIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  noImageLabel: { fontSize: 14, fontWeight: "800" },
  noImageSub:   { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // Body
  body:     { padding: 14 },
  badgeRow: {
    flexDirection: "row", alignItems: "center",
    gap: 6, marginBottom: 10, flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  dot:       { width: 6, height: 6, borderRadius: 3 },

  catBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  catBadgeText: { fontSize: 11, fontWeight: "600", color: "#64748b" },

  title: {
    fontSize: 16, fontWeight: "800",
    color: "#0f172a", lineHeight: 22, marginBottom: 5,
  },
  description: {
    fontSize: 13, color: "#64748b",
    lineHeight: 19, marginBottom: 2,
  },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },

  // Footer
  footer:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upvoteBtn:  { flexDirection: "row", alignItems: "center", gap: 8 },
  upvoteCircle: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: "center", alignItems: "center",
  },
  voteCount: { fontSize: 15, fontWeight: "800" },

  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  mapBtnText: { fontSize: 12, fontWeight: "700", color: "#1d4ed8" },
});