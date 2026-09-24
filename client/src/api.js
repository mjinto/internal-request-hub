async function requestJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}.`);
  }
  return body;
}

export async function loadUsers() {
  return (await requestJson("/api/users")).data;
}

export async function loadRequests(currentUserId) {
  return (await requestJson(`/api/requests?currentUserId=${currentUserId}`)).data;
}

export async function loadRequest(requestId, currentUserId) {
  return (await requestJson(`/api/requests/${requestId}?currentUserId=${currentUserId}`)).data;
}
