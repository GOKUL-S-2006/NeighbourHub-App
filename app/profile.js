// app/profile.js
import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "../screens/Profilescreen";

export default function ProfilePage() {
  const { user } = useLocalSearchParams();
  const currentUser = user ? JSON.parse(user) : null;
  
  console.log("✅ profile.js loaded");           // check if route loads
 //console.log("📦 raw user param:", user); 
  return <ProfileScreen currentUser={currentUser} onLogout={() => {}} />;
}