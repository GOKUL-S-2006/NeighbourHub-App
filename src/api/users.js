import API from "./api";

// CREATE USER
export const createUser = async (userData) => {
  const response = await API.post("/users", userData);
  return response.data;
};

// GET ALL USERS
export const getAllUsers = async () => {
  const response = await API.get("/users");
  return response.data;
};