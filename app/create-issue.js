import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { createIssue } from "../src/api/issue";
import { useRouter } from "expo-router";

export default function CreateIssue() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: later replace with AuthContext / AsyncStorage
  const token = "USER_JWT_TOKEN";

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Gallery permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission denied");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(`${loc.coords.latitude}, ${loc.coords.longitude}`);
  };

  const submit = async () => {
    if (!title || !location) {
      alert("Title and location are required");
      return;
    }

    setLoading(true);

    try {
      await createIssue(
        {
          title,
          description,
          image,
          location,
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
    <View style={styles.container}>
      <Text style={styles.title}>Report an Issue</Text>

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

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Text>📷 Add Image</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={getLocation}>
        <Text>📍 Add Location</Text>
      </TouchableOpacity>

      {location && <Text style={styles.location}>{location}</Text>}

      <TouchableOpacity
        style={[styles.submit, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  btn: {
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  location: {
    marginTop: 8,
    color: "#555",
  },
  submit: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
});