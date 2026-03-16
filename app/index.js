import { useEffect, useRef, useState } from "react";
import {
  View, Image, Text, StyleSheet,
  Animated, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../src/api/auth";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router     = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const tagAnim   = useRef(new Animated.Value(0)).current;
  const loginAnim = useRef(new Animated.Value(0)).current;

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // Hide expo native splash immediately
    SplashScreen.hideAsync();

    // Animate logo in
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 900, useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1, friction: 4, tension: 40, useNativeDriver: true,
        }),
      ]),
      Animated.timing(tagAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();

    // After 3 seconds switch to login
    const timer = setTimeout(() => {
      setShowLogin(true);
      Animated.timing(loginAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const res   = await loginUser({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      const token = res?.token || res?.data?.token;
      if (!token) {
        Alert.alert("Login Failed", "No token returned from server");
        return;
      }
      await AsyncStorage.setItem("token", token);
      router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── SPLASH ──────────────────────────────────────────
  if (!showLogin) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image
            source={require("../assets/splash.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>NEIGHBOURHUB</Text>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: tagAnim }]}>
          BETTER COMMUNICATION. SAFER STREETS. STRONGER BONDS
        </Animated.Text>
      </View>
    );
  }

  // ── LOGIN ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.loginContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: loginAnim, width: "100%" }}>

          <View style={styles.loginHeader}>
            <Image
              source={require("../assets/splash.jpeg")}
              style={styles.loginLogo}
              resizeMode="contain"
            />
            <Text style={styles.loginTitle}>Welcome Back</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to your NeighbourHub account
            </Text>
          </View>

          <View style={styles.card}>

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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push("/signup")}
              activeOpacity={0.85}
            >
              <Text style={styles.outlineButtonText}>Create an Account</Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.footerText}>
            NeighbourHub — Connecting Communities
          </Text>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Splash ──
  splashContainer: {
    flex: 1, backgroundColor: "#ffffff",
    justifyContent: "center", alignItems: "center",
  },
  logoContainer: { alignItems: "center", paddingHorizontal: 40 },
  logo:          { width: 200, height: 200, marginBottom: 20 },
  appName: {
    fontSize: 26, fontWeight: "800",
    letterSpacing: 4, color: "#111111", textAlign: "center",
  },
  divider: {
    width: 120, height: 1.5,
    backgroundColor: "#111111", marginVertical: 10,
  },
  tagline: {
    fontSize: 9, letterSpacing: 1.5, color: "#555555",
    textAlign: "center", fontWeight: "500",
    position: "absolute", bottom: 180, paddingHorizontal: 40,
  },

  // ── Login ──
  loginContainer: {
    flexGrow: 1, backgroundColor: "#f3f4f6",
    alignItems: "center", paddingVertical: 40, paddingHorizontal: 20,
  },
  loginHeader:   { alignItems: "center", marginBottom: 24 },
  loginLogo:     { width: 80, height: 80, marginBottom: 12 },
  loginTitle: {
    fontSize: 26, fontWeight: "800",
    color: "#111827", letterSpacing: 0.5,
  },
  loginSubtitle: {
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
    backgroundColor: "#2563eb", borderRadius: 12,
    padding: 16, alignItems: "center", marginTop: 24,
  },
  buttonText:  { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  orRow: {
    flexDirection: "row", alignItems: "center", marginVertical: 20,
  },
  orLine:  { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: {
    marginHorizontal: 12, color: "#9ca3af",
    fontSize: 13, fontWeight: "500",
  },
  outlineButton: {
    borderWidth: 1.5, borderColor: "#2563eb",
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  outlineButtonText: { color: "#2563eb", fontSize: 16, fontWeight: "700" },
  footerText: {
    marginTop: 28, fontSize: 12,
    color: "#9ca3af", textAlign: "center",
  },
});