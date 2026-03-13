import axios from "axios";

// ⚠️ Use your local IP, NOT localhost
// Example: http://192.168.1.5:5000
const API = axios.create({
  baseURL: "http://172.16.190.133:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;