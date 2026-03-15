import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { createIssue } from "../src/api/issue";

export default function CreateIssue() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = "USER_JWT_TOKEN"; // replace with real token logic

  // 📷 PICK IMAGE
 const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Gallery permission required");
    return;
  }

  // Safe fallback for different versions
  const mediaTypes = ImagePicker.MediaTypeOptions?.Images || "Images";

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypes,
    quality: 0.7,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};
  // 📍 GET GPS LOCATION
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Location permission denied");
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err) {
      console.error(err);
      alert(
        "Unable to get current location. Make sure location services are enabled."
      );
    }
  };

  // ☁️ UPLOAD IMAGE TO CLOUDINARY
 const uploadImage = async (localUri) => {
  const data = new FormData();
  data.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: "issue.jpg",
  });
  data.append("upload_preset", "neighbourhub"); // unsigned preset
  data.append("folder", "issues"); // optional

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dkhdzqxgj/image/upload`,
    {
      method: "POST",
      body: data,
    }
  );
  const json = await res.json();
  console.log("Cloudinary URL:", json.secure_url);
  return json.secure_url;
};
  // 🚀 SUBMIT ISSUE
  const submit = async () => {
  if (!title || !coords) {
    alert("Title and location are required");
    return;
  }

  setLoading(true);

  try {
    // upload image if selected
    const uploadedImage = image ? await uploadImage(image) : null;
    console.log("Cloudinary URL:", uploadedImage);

    await createIssue(
      {
        title,
        description,
        image: uploadedImage,
        location: `${coords.latitude},${coords.longitude}`,
        category: "general",
      },
      token
    );

    alert("Issue reported successfully ✅");
    router.replace("/home");
  } catch (err) {
    console.log(err.response?.data || err.message);
    alert("Failed to submit issue ❌");
  } finally {
    setLoading(false);
  }
};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report Issue</Text>

      <TextInput
        placeholder="Issue title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Describe the issue"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
      />

      {/* IMAGE PREVIEW */}
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
        <Ionicons name="image-outline" size={20} />
        <Text style={styles.actionText}>Add Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={getLocation}>
        <Ionicons name="location-outline" size={20} />
        <Text style={styles.actionText}>Use My Location</Text>
      </TouchableOpacity>

      {/* MAP PREVIEW */}
      {coords && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={coords} />
        </MapView>
      )}

      <TouchableOpacity
        style={[styles.submit, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Issue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f6fa" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 15 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  image: { width: "100%", height: 200, borderRadius: 12, marginBottom: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 10,
  },
  actionText: { fontWeight: "500" },
  map: { width: "100%", height: 200, borderRadius: 12, marginTop: 15 },
  submit: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});