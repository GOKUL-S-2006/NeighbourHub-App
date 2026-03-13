// src/api/auth.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://172.16.190.133:5000/api", // <-- your IP
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ SIGNUP
export const registerUser = (data) => {
  return API.post("/auth/signup", data);
};

// ✅ LOGIN
export const loginUser = (data) => {
  return API.post("/auth/login", data);
};