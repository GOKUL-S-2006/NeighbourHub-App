import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRef } from "react";

export default function IssueCard({ issue, currentUserId, onMapPress, onUpvote }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleUpvotePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    onUpvote(issue);
  };

  const hasUpvoted = issue.votedBy?.map(id => id.toString()).includes(currentUserId?.toString());

  return (
    <View style={styles.card}>
      {issue.image && <Image source={{ uri: issue.image }} style={styles.image} />}
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.description}>{issue.description}</Text>

      {issue.location && (
        <TouchableOpacity style={styles.locationRow} onPress={() => onMapPress(issue.location)}>
          <MaterialIcons name="location-on" size={20} color="#2563eb" />
          <Text style={styles.locationText}>Location</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleUpvotePress} style={styles.upvoteBtn}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={hasUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={28}
              color={hasUpvoted ? "#16a34a" : "#4b5563"}
            />
          </Animated.View>
          <Text style={[styles.votes, { color: hasUpvoted ? "#16a34a" : "#4b5563" }]}>
            {issue.votes}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.status, issue.status === "open" ? { color: "#16a34a" } : { color: "#f97316" }]}>
          {issue.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, marginVertical: 10, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  image: { width: "100%", height: 200, borderRadius: 12, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  description: { fontSize: 14, color: "#4b5563", marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  locationText: { marginLeft: 4, color: "#2563eb", fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  votes: { fontWeight: "700" },
  status: { fontWeight: "700", fontSize: 12 },
});