// src/api/post.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://neighbourhub-backend.onrender.com/api", // your local IP
  headers: {
    "Content-Type": "application/json",
  },
});

export const createPost = async (data) => {
  return API.post("/posts", data);
};