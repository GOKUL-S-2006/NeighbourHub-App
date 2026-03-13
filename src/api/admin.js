import API from "./api";

// GET ALL ISSUES (ADMIN)
export const getAdminIssues = async () => {
  const response = await API.get("/admin/issues");
  return response.data;
};

// UPDATE ISSUE STATUS
export const updateIssueStatus = async (id, status) => {
  const response = await API.put(`/admin/issues/${id}`, { status });
  return response.data;
};