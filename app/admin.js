import { useLocalSearchParams } from "expo-router";
import AdminScreen from "../screens/AdminScreen";

export default function AdminPage() {
  const { user } = useLocalSearchParams();
  const currentUser = user ? JSON.parse(user) : null;
  return <AdminScreen currentUser={currentUser} />;
}