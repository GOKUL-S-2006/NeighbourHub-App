import API from "./api";

export const getIssues = async () => {
  const res = await API.get("/issues");
  return res.data;
};
// ─── ADMIN ROUTES ─────────────────────────────────────
export const getAdminIssues = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({ page, limit, ...filters }).toString();
  const res = await API.get(`/admin/issues?${params}`);
  return res.data; // { page, limit, totalPages, totalCount, data }
};

export const getAdminStats = async () => {
  const res = await API.get("/admin/dashboard");
  return res.data; // { totalIssues, openIssues, inProgressIssues, resolvedIssues, totalUsers, totalVotes }
};

export const adminUpdateStatus = async (id, status) => {
  const res = await API.patch(`/admin/issues/${id}/status`, { status });
  return res.data;
};

export const adminDeleteIssue = async (id) => {
  const res = await API.delete(`/admin/issues/${id}`);
  return res.data;
};
export const getMyIssues = async () => {
  const res = await API.get("/issues/my");
  return res.data;
};
export const updateStatus = async (id, status) => {
  const res = await API.patch(`/issues/${id}/status`, { status });
  return res.data;
};
export const createIssue = async (data) => {
  const res = await API.post("/issues", data);
  return res.data;
};

export const upvoteIssue = async (issueId) => {
  const res = await API.patch(`/issues/${issueId}/upvote`, {});
  return res.data;
};

export const deleteIssue = async (id) => {
  const res = await API.delete(`/issues/${id}`);
  return res.data;
};

export const updateIssue = async (id, data) => {
  const res = await API.put(`/issues/${id}`, data);
  return res.data;
};