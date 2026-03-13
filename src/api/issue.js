import API from "./api";

// CREATE ISSUE
export const createIssue = async (issueData) => {
  const response = await API.post("/issues", issueData);
  return response.data;
};

// GET ALL ISSUES
export const getAllIssues = async () => {
  const response = await API.get("/issues");
  return response.data;
};