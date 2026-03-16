import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="create-issue" />
      <Stack.Screen name="map" />
      <Stack.Screen name="news" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}


