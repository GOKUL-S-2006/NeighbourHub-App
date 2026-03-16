import API from "./api";

export const getNewsBrief = async () => {
console.log("📡 calling /news/brief API"); // check if API is called
  const res = await API.get("/news/brief");
  console.log("📡 API response status:", res.status); // check status
  return res.data;
};