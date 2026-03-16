import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator, Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getNewsBrief } from "../src/api/news";

export default function NewsScreen() {
  const router = useRouter();
  const [news, setNews]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const fadeAnim              = useRef(new Animated.Value(0)).current;
  const pulseAnim             = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadNews(); }, []);

  // pulse animation for AI badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    fadeAnim.setValue(0);
    try {
      const data = await getNewsBrief();
      setNews(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err) {
      setError("Could not load news brief. Please try again.");
      console.log("News error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseLines = (text) => {
    if (!text) return [];
    return text.split("\n").filter(l => l.trim().length > 0);
  };

  const getLineStyle = (line) => {
    if (line.startsWith("NeighbourHub Daily Brief")) return "heading";
    if (line.match(/^\w+\s\d+,?\s\d{4}/) || line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)) return "date";
    if (line.startsWith("• URGENT") || line.toLowerCase().includes("emergency") || line.toLowerCase().includes("urgent")) return "urgent";
    if (line.startsWith("•")) return "bullet";
    if (line.startsWith("  -") || line.startsWith("- ")) return "subbullet";
    if (line.match(/^[A-Z][^•]/) && !line.startsWith("•") && line.length < 120) return "footer";
    return "normal";
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Brief</Text>
          <Text style={styles.headerSub}>{today}</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && { opacity: 0.4 }]}
          onPress={loadNews}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── AI Banner ── */}
      <Animated.View style={[styles.aiBanner, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.aiBannerLeft}>
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.aiBannerTitle}>Powered by  AI</Text>
            <Text style={styles.aiBannerSub}>
              Analysing live community data to generate your brief
            </Text>
          </View>
        </View>
        <View style={styles.aiBannerBadge}>
          <Text style={styles.aiBannerBadgeText}>LIVE</Text>
        </View>
      </Animated.View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingState}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconWrap}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
            <Text style={styles.loadingTitle}>AI is generating your brief...</Text>
            <Text style={styles.loadingSubtitle}>
              Analysing recent issues, resolutions and community activity
            </Text>
            <View style={styles.loadingSteps}>
              {[
                "Fetching community data",
                "Analysing issue patterns",
                "Generating news brief",
              ].map((step, i) => (
                <View key={i} style={styles.loadingStep}>
                  <View style={[styles.loadingStepDot,
                    { backgroundColor: i === 0 ? "#7c3aed" : "#e2e8f0" }]} />
                  <Text style={styles.loadingStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={56} color="#d1d5db" />
          <Text style={styles.errorTitle}>Brief unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadNews}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats row */}
          {news?.stats && (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}>
                <Ionicons name="document-text" size={20} color="#1d4ed8" />
                <Text style={[styles.statNum, { color: "#1d4ed8" }]}>{news.stats.todayCount}</Text>
                <Text style={[styles.statLabel, { color: "#1d4ed8" }]}>Today</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="checkmark-done-circle" size={20} color="#15803d" />
                <Text style={[styles.statNum, { color: "#15803d" }]}>{news.stats.resolvedCount}</Text>
                <Text style={[styles.statLabel, { color: "#15803d" }]}>Resolved</Text>
              </View>
              <View style={[styles.statCard,
                { backgroundColor: news.stats.emergencyCount > 0 ? "#fee2e2" : "#f1f5f9" }]}>
                <Ionicons name="alert-circle" size={20}
                  color={news.stats.emergencyCount > 0 ? "#dc2626" : "#94a3b8"} />
                <Text style={[styles.statNum,
                  { color: news.stats.emergencyCount > 0 ? "#dc2626" : "#94a3b8" }]}>
                  {news.stats.emergencyCount}
                </Text>
                <Text style={[styles.statLabel,
                  { color: news.stats.emergencyCount > 0 ? "#dc2626" : "#94a3b8" }]}>
                  Emergency
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#f3e8ff" }]}>
                <Ionicons name="calendar" size={20} color="#7c3aed" />
                <Text style={[styles.statNum, { color: "#7c3aed" }]}>{news.stats.weekCount}</Text>
                <Text style={[styles.statLabel, { color: "#7c3aed" }]}>This week</Text>
              </View>
            </View>
          )}

          {/* Main news card */}
          <View style={styles.newsCard}>

            {/* Card header */}
            <View style={styles.newsCardHeader}>
              <View style={styles.newsCardHeaderLeft}>
                <Text style={styles.newsCardTitle}>NeighbourHub Daily Brief</Text>
                <Text style={styles.newsCardDate}>{today}</Text>
              </View>
              <View style={styles.aiSourceBadge}>
                <Ionicons name="sparkles" size={12} color="#7c3aed" />
                <Text style={styles.aiSourceText}>
                  {news?.source === "gemini" ? "Gemini AI" : "Auto"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Brief lines */}
            <View style={styles.briefContent}>
              {parseLines(news?.brief || "").map((line, index) => {
                const lineType = getLineStyle(line);
                if (lineType === "heading") return null; // already in card header
                return (
                  <View key={index} style={styles.lineWrapper}>
                    {lineType === "date" && (
                      <Text style={styles.briefDate}>{line}</Text>
                    )}
                    {lineType === "urgent" && (
                      <View style={styles.urgentLine}>
                        <View style={styles.urgentIconWrap}>
                          <Ionicons name="alert" size={14} color="#fff" />
                        </View>
                        <Text style={styles.urgentText}>{line.replace("• ", "")}</Text>
                      </View>
                    )}
                    {lineType === "bullet" && (
                      <View style={styles.bulletLine}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{line.replace("• ", "")}</Text>
                      </View>
                    )}
                    {lineType === "subbullet" && (
                      <View style={styles.subBulletLine}>
                        <View style={styles.subBulletDot} />
                        <Text style={styles.subBulletText}>
                          {line.replace("  - ", "").replace("- ", "")}
                        </Text>
                      </View>
                    )}
                    {lineType === "footer" && (
                      <View style={styles.footerLine}>
                        <Ionicons name="heart" size={14} color="#7c3aed" />
                        <Text style={styles.footerText}>{line}</Text>
                      </View>
                    )}
                    {lineType === "normal" && (
                      <Text style={styles.normalText}>{line}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Generated at */}
            {news?.generatedAt && (
              <View style={styles.generatedAt}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.generatedAtText}>
                  Generated at {formatDate(news.generatedAt)}
                </Text>
              </View>
            )}
          </View>

          {/* AI disclaimer */}
          <View style={styles.aiDisclaimer}>
            <Ionicons name="information-circle-outline" size={16} color="#7c3aed" />
            <Text style={styles.aiDisclaimerText}>
              This brief is automatically generated  AI based on
              real community data from NeighbourHub. No human editorial involvement.
            </Text>
          </View>

          <Text style={styles.refreshNote}>
            Refreshes every time you open this screen
          </Text>
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  // Header
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
  headerCenter: { alignItems: "center" },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub:    { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },

  // AI Banner
  aiBanner: {
    backgroundColor: "#4c1d95",
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  aiBannerLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  aiIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#7c3aed",
    justifyContent: "center", alignItems: "center",
  },
  aiBannerTitle: { fontSize: 14, fontWeight: "800", color: "#fff" },
  aiBannerSub:   { fontSize: 11, color: "#c4b5fd", marginTop: 2, flex: 1 },
  aiBannerBadge: {
    backgroundColor: "#ef4444", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  aiBannerBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },

  // Loading
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingCard: {
    backgroundColor: "#fff", borderRadius: 24,
    padding: 32, alignItems: "center", width: "100%",
    shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  loadingIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#f3e8ff",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  loadingTitle:    { fontSize: 17, fontWeight: "800", color: "#1e293b", marginBottom: 8, textAlign: "center" },
  loadingSubtitle: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  loadingSteps:    { width: "100%", gap: 10 },
  loadingStep:     { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingStepDot:  { width: 8, height: 8, borderRadius: 4 },
  loadingStepText: { fontSize: 13, color: "#64748b" },

  // Error
  errorState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  errorText:  { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#7c3aed", paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 20,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scrollContent: { padding: 16, paddingBottom: 50 },

  // Stats grid
  statsGrid: {
    flexDirection: "row", gap: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: "center", gap: 4,
  },
  statNum:   { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "700" },

  // News card
  newsCard: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 20, marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  newsCardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 12,
  },
  newsCardHeaderLeft: { flex: 1, marginRight: 8 },
  newsCardTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  newsCardDate:  { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  aiSourceBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f3e8ff", paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
  },
  aiSourceText: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 14 },

  briefContent: { gap: 2 },
  lineWrapper:  { marginBottom: 6 },

  briefDate: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },

  urgentLine: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#fee2e2", borderRadius: 12,
    padding: 12, marginVertical: 4,
    borderLeftWidth: 3, borderLeftColor: "#dc2626",
  },
  urgentIconWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#dc2626",
    justifyContent: "center", alignItems: "center",
    marginTop: 1,
  },
  urgentText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#dc2626", lineHeight: 20 },

  bulletLine: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: "#f8fafc",
  },
  bulletDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#7c3aed", marginTop: 6,
  },
  bulletText: { flex: 1, fontSize: 14, color: "#1e293b", lineHeight: 22 },

  subBulletLine: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingLeft: 20, paddingVertical: 3 },
  subBulletDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: "#94a3b8", marginTop: 8 },
  subBulletText: { flex: 1, fontSize: 12, color: "#64748b", lineHeight: 18 },

  footerLine: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
    backgroundColor: "#faf5ff", borderRadius: 10, padding: 12,
  },
  footerText: { flex: 1, fontSize: 13, color: "#7c3aed", fontStyle: "italic", lineHeight: 20 },
  normalText: { fontSize: 13, color: "#64748b", lineHeight: 20 },

  generatedAt: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  generatedAtText: { fontSize: 11, color: "#94a3b8" },

  // AI disclaimer
  aiDisclaimer: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#f3e8ff", borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  aiDisclaimerText: { flex: 1, fontSize: 12, color: "#6d28d9", lineHeight: 18 },

  refreshNote: {
    fontSize: 12, color: "#94a3b8",
    textAlign: "center", lineHeight: 18,
  },
});