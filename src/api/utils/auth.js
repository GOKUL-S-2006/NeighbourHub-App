
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem("token"); // key must match what you save on login
    if (!token) return null;

    const decoded = jwtDecode(token);
    return {
      id: decoded.id || decoded._id || decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    console.log("Token decode error:", err);
    return null;
  }
};