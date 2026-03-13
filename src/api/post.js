// src/api/post.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.56.1:5000/api", // your local IP
  headers: {
    "Content-Type": "application/json",
  },
});

export const createPost = async (data) => {
  return API.post("/posts", data);
};