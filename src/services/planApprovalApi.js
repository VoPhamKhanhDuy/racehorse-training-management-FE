import { apiRequest } from "./apiClient";
import { notifyApprovalUpdate, subscribeApprovalUpdates } from "./approvalUpdates";

export const PLAN_APPROVAL_NOTE_MAX = 300;
export const subscribePlanApprovals = (callback) => subscribeApprovalUpdates("plans", callback);
export const getPlanApproval = (id) => apiRequest(`/approvals/plans/${id}`);
export const getOwnerPlanApprovals = () => apiRequest("/approvals/plans");

export async function sendPlanToOwner(plan) {
  const record = await apiRequest(`/approvals/plans/${plan.planId}/send`, { method: "POST" });
  notifyApprovalUpdate("plans");
  return record;
}

async function decide(planId, status, note, version) {
  const record = await apiRequest(`/approvals/plans/${planId}/decision`, {
    method: "POST", body: { status, note, version },
  });
  notifyApprovalUpdate("plans");
  return record;
}
export const approvePlan = (id, version) => decide(id, "Approved", "", version);
export const requestPlanChanges = (id, note, version) => decide(id, "ChangesRequested", note, version);
export const rejectPlan = (id, note, version) => decide(id, "Rejected", note, version);

export async function getPlanApprovalMap() {
  const list = await apiRequest("/approvals/plans");
  return Object.fromEntries(list.map((p) => [p.planId, p.status]));
}
export const getOwnerUpcomingSessions = (_horseIds, range) => apiRequest("/approvals/owner-sessions", { query: range });
export const countUnreadNotices = () => apiRequest("/approvals/plans/unread");

export async function markNoticesRead(_role, { planId } = {}) {
  // Read flags are on the server; marking read does not trigger another data-refresh loop.
  await apiRequest("/approvals/plans/read", { method: "POST", body: { planId: planId == null ? null : Number(planId) } });
}
