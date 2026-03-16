import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { registerUser } from "../src/api/auth";

export default function Signup() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    try {
      setLoading(true);
      const res = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      Alert.alert("Success", "Account created! Please sign in.");
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Signup Failed",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/splash.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join your neighbourhood community today
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {/* Signup button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Back to login */}
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.footerText}>
          NeighbourHub — Connecting Communities
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: "#f3f4f6",
    alignItems: "center", paddingVertical: 40, paddingHorizontal: 20,
  },
  header:   { alignItems: "center", marginBottom: 24 },
  logo:     { width: 80, height: 80, marginBottom: 12 },
  title: {
    fontSize: 26, fontWeight: "800",
    color: "#111827", letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14, color: "#6b7280",
    marginTop: 4, textAlign: "center",
  },
  card: {
    width: "100%", backgroundColor: "#ffffff",
    borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: {
    fontSize: 13, fontWeight: "600",
    color: "#374151", marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: "#f9fafb", borderWidth: 1,
    borderColor: "#e5e7eb", borderRadius: 12,
    padding: 14, fontSize: 15, color: "#111827",
  },
  button: {
    backgroundColor: "#16a34a", borderRadius: 12,
    padding: 16, alignItems: "center", marginTop: 24,
  },
  buttonText: {
    color: "#ffffff", fontSize: 16, fontWeight: "700",
  },
  orRow: {
    flexDirection: "row", alignItems: "center", marginVertical: 20,
  },
  orLine:  { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: {
    marginHorizontal: 12, color: "#9ca3af",
    fontSize: 13, fontWeight: "500",
  },
  outlineButton: {
    borderWidth: 1.5, borderColor: "#16a34a",
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  outlineButtonText: {
    color: "#16a34a", fontSize: 15, fontWeight: "700",
  },
  footerText: {
    marginTop: 28, fontSize: 12,
    color: "#9ca3af", textAlign: "center",
  },
});