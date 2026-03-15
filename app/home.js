import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";

import { getIssues, upvoteIssue } from "../src/api/issue";
import { getCurrentUser } from "../src/api/utils/auth"; // ✅ fixed path
import IssueCard from "../components/issueCard";

export default function Home() {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadIssues();
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getCurrentUser();
    console.log("👤 loaded user:", user); // debug
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>NeighbourHub</Text>
          <Text style={styles.subTitle}>Local issues, community fixes</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Admin button — only shown if role is admin */}
          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => router.push({
                pathname: "/admin",
                params: { user: JSON.stringify(currentUser) }
              })}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Profile bubble */}
          <TouchableOpacity
            style={styles.avatarBubble}
            onPress={() => router.push({
              pathname: "/profile",
              params: { user: JSON.stringify(currentUser) }
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarInitial}>
              {currentUser?.name?.[0]?.toUpperCase() || "?"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Issues Feed */}
      <FlatList
        data={issues}
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
      />

      {/* Floating Create Button */}
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
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingTop: 52 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  appName: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Red shield button for admin
  adminBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // Blue initial bubble for profile
  avatarBubble: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitial: { fontSize: 17, fontWeight: "800", color: "#fff" },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#2563eb",
    width: 60, height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});