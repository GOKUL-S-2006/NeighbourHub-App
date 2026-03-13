import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter(); // ✅ THIS WAS MISSING

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Screen</Text>

      <TouchableOpacity
        onPress={() => router.push("/create-issue")}
        style={{ marginTop: 20 }}
      >
        <Text>Create Issue</Text>
      </TouchableOpacity>
    </View>
  );
}