import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createIssue, upvoteIssue } from "../src/api/issue";

const CATEGORIES = ["general", "road", "water", "electricity", "sanitation", "safety", "noise", "other"];
const SEVERITIES = ["Low", "Medium", "High", "Emergency"];

const SEVERITY_COLORS = {
  Low:       { bg: "#dcfce7", text: "#16a34a", icon: "checkmark-circle" },
  Medium:    { bg: "#fef9c3", text: "#ca8a04", icon: "warning" },
  High:      { bg: "#fee2e2", text: "#dc2626", icon: "alert-circle" },
  Emergency: { bg: "#450a0a", text: "#fca5a5", icon: "alert-circle" },
};

const BACKEND_URL = "http://10.91.197.133:5000";

export default function CreateIssue() {
  const router = useRouter();

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage]             = useState(null);
  const [coords, setCoords]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [category, setCategory]       = useState("general");
  const [severity, setSeverity]       = useState("Low");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiDone, setAiDone]           = useState(false);

  // ── DUPLICATE STATE ───────────────────────────────────
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [duplicateIssue, setDuplicateIssue] = useState(null);
  const [upvoting, setUpvoting]             = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Gallery permission required"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setAiDone(false);
      analyzeImage(uri);
    }
  };

  const analyzeImage = async (uri) => {
    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", { uri, name: "photo.jpg", type: "image/jpeg" });
      const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await response.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data.severity && SEVERITIES.includes(data.severity)) setSeverity(data.severity);
      setAiDone(true);
    } catch (err) {
      console.log("AI analysis failed:", err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { alert("Location permission denied"); return; }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (err) {
      alert("Unable to get location.");
    }
  };

  const uploadImage = async (localUri) => {
    const data = new FormData();
    data.append("file", { uri: localUri, type: "image/jpeg", name: "issue.jpg" });
    data.append("upload_preset", "neighbourhub");
    data.append("folder", "issues");
    const res = await fetch("https://api.cloudinary.com/v1_1/dkhdzqxgj/image/upload", { method: "POST", body: data });
    const json = await res.json();
    return json.secure_url;
  };

  // ─── SUBMIT ───────────────────────────────────────────
  const submit = async () => {
    if (!title || !coords) { alert("Title and location are required"); return; }
    setLoading(true);
    try {
      const uploadedImage = image ? await uploadImage(image) : null;
      await createIssue({
        title,
        description,
        image: uploadedImage,
        location: `${coords.latitude},${coords.longitude}`,
        category,
        severity,
      });
      alert("Issue reported successfully ✅");
      router.replace("/home");
    } catch (err) {
      // ── DUPLICATE DETECTED (409) ──────────────────────
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateIssue(err.response.data.existing);
        setDuplicateModal(true);
      } else {
        console.log(err.response?.data || err.message);
        alert("Failed to submit issue ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── UPVOTE EXISTING INSTEAD ───────────────────────────
  const handleUpvoteDuplicate = async () => {
    if (!duplicateIssue) return;
    setUpvoting(true);
    try {
      await upvoteIssue(duplicateIssue._id);
      setDuplicateModal(false);
      alert("Upvoted the existing issue ✅");
      router.replace("/home");
    } catch (err) {
      alert("Failed to upvote ❌");
    } finally {
      setUpvoting(false);
    }
  };

  const sevColor = SEVERITY_COLORS[severity];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Report Issue</Text>

      {/* ── DUPLICATE MODAL ── */}
      <Modal visible={duplicateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={32} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Already Reported!</Text>
            <Text style={styles.modalSubtitle}>
              Already on our radar! A similar issue was reported near you. Upvote it to push for faster resolution!
            </Text>

            {duplicateIssue && (
              <View style={styles.duplicateIssueBox}>
                {duplicateIssue.image ? (
                  <Image source={{ uri: duplicateIssue.image }} style={styles.duplicateImage} />
                ) : null}
                <Text style={styles.duplicateTitle}>{duplicateIssue.title}</Text>
                <Text style={styles.duplicateDesc} numberOfLines={2}>
                  {duplicateIssue.description}
                </Text>
                <View style={styles.duplicateMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="arrow-up" size={12} color="#16a34a" />
                    <Text style={styles.metaText}>{duplicateIssue.votes ?? 0} votes</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="radio-button-on" size={12} color="#2563eb" />
                    <Text style={styles.metaText}>{duplicateIssue.status}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.upvoteBtn}
              onPress={handleUpvoteDuplicate}
              disabled={upvoting}
            >
              {upvoting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                  <Text style={styles.upvoteBtnText}>Upvote Existing Issue</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setDuplicateModal(false)}
            >
              <Text style={styles.dismissText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Upload */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photo</Text>
        {image ? (
          <View>
            <Image source={{ uri: image }} style={styles.image} />
            {aiLoading && (
              <View style={styles.aiBanner}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.aiBannerText}>AI is analysing your image...</Text>
              </View>
            )}
            {aiDone && !aiLoading && (
              <View style={[styles.aiBanner, styles.aiBannerDone]}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={[styles.aiBannerText, { color: "#16a34a" }]}>
                  AI filled title, description, category & severity — edit if needed
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
              <Ionicons name="refresh" size={16} color="#2563eb" />
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Ionicons name="camera-outline" size={36} color="#94a3b8" />
            <Text style={styles.imagePickerText}>Tap to upload photo</Text>
            <Text style={styles.imagePickerSub}>AI will auto-fill details from your photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Issue Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Issue Details</Text>

        <Text style={styles.label}>Title *{aiDone ? "  ✦ AI generated" : ""}</Text>
        <TextInput
          placeholder="e.g. Broken streetlight on Main St"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Text style={styles.label}>Description{aiDone ? "  ✦ AI generated" : ""}</Text>
        <TextInput
          placeholder="Describe the issue..."
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Text style={styles.label}>Category{aiDone ? "  ✦ AI detected" : ""}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Severity{aiDone ? "  ✦ AI detected" : ""}</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map(sev => {
            const col = SEVERITY_COLORS[sev];
            const isActive = severity === sev;
            return (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityChip,
                  { backgroundColor: isActive ? col.bg : "#f1f5f9" },
                  isActive && { borderColor: col.text, borderWidth: 1.5 },
                ]}
                onPress={() => setSeverity(sev)}
              >
                <Ionicons name={col.icon} size={14} color={isActive ? col.text : "#9ca3af"} />
                <Text style={[styles.severityText, { color: isActive ? col.text : "#9ca3af" }]}>{sev}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.severityDisplay, { backgroundColor: sevColor.bg }]}>
          <Ionicons name={sevColor.icon} size={16} color={sevColor.text} />
          <Text style={[styles.severityDisplayText, { color: sevColor.text }]}>Severity: {severity}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location *</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={getLocation}>
          <Ionicons name="location-outline" size={20} color="#374151" />
          <Text style={styles.actionText}>
            {coords ? "📍 Location Captured — Tap to update" : "Use My Location"}
          </Text>
        </TouchableOpacity>
        {coords && (
          <MapView
            style={styles.map}
            initialRegion={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          >
            <Marker coordinate={coords} />
          </MapView>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submit, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Issue</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f1f5f9", paddingBottom: 60 },
  pageTitle: { fontSize: 26, fontWeight: "800", marginBottom: 20, color: "#1e293b" },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 24, width: "100%", alignItems: "center",
  },
  modalIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#fee2e2", justifyContent: "center",
    alignItems: "center", marginBottom: 12,
  },
  modalTitle:    { fontSize: 20, fontWeight: "800", color: "#1e293b", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16, lineHeight: 19 },

  duplicateIssueBox: {
    width: "100%", backgroundColor: "#f8fafc",
    borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  duplicateImage: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  duplicateTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
  duplicateDesc:  { fontSize: 12, color: "#64748b", marginBottom: 8 },
  duplicateMeta:  { flexDirection: "row", gap: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f1f5f9", paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 20,
  },
  metaText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  upvoteBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#16a34a", paddingVertical: 14,
    paddingHorizontal: 24, borderRadius: 12, width: "100%",
    justifyContent: "center", marginBottom: 10,
  },
  upvoteBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  dismissBtn:    { paddingVertical: 10 },
  dismissText:   { color: "#94a3b8", fontWeight: "600", fontSize: 14 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 14, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 12 },

  imagePicker: {
    borderWidth: 2, borderColor: "#e2e8f0", borderStyle: "dashed",
    borderRadius: 12, height: 150, justifyContent: "center",
    alignItems: "center", backgroundColor: "#f8fafc", gap: 8,
  },
  imagePickerText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  imagePickerSub:  { fontSize: 12, color: "#94a3b8" },
  image: { width: "100%", height: 200, borderRadius: 12 },

  aiBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#eff6ff", padding: 10, borderRadius: 10, marginTop: 10,
  },
  aiBannerDone: { backgroundColor: "#f0fdf4" },
  aiBannerText: { fontSize: 12, fontWeight: "600", color: "#2563eb", flex: 1 },

  changeImageBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginTop: 8, paddingVertical: 8,
  },
  changeImageText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },

  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "#f8fafc", padding: 12, borderRadius: 10,
    marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb",
    fontSize: 14, color: "#1e293b",
  },
  textArea: { height: 100, textAlignVertical: "top" },

  chipRow: { marginBottom: 14 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f1f5f9", marginRight: 8,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive:     { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipText:       { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  chipTextActive: { color: "#fff" },

  severityRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  severityChip: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: "transparent",
  },
  severityText: { fontSize: 12, fontWeight: "700" },
  severityDisplay: {
    flexDirection: "row", alignItems: "center",
    gap: 6, padding: 10, borderRadius: 10, marginBottom: 4,
  },
  severityDisplayText: { fontSize: 13, fontWeight: "700" },

  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 13, backgroundColor: "#f8fafc",
    borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb",
  },
  actionText: { fontWeight: "600", color: "#374151" },
  map: { width: "100%", height: 200, borderRadius: 12, marginTop: 12 },

  submit: {
    marginTop: 8, padding: 16,
    backgroundColor: "#2563eb", borderRadius: 14, alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});