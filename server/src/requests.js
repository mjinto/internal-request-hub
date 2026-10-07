import { HttpError } from "./http-errors.js";

const requestSelect = `
  SELECT
    r.id,
    r.title,
    r.description,
    r.priority,
    r.status,
    r.reviewer_comment AS reviewerComment,
    r.created_at AS createdAt,
    r.updated_at AS updatedAt,
    c.id AS categoryId,
    c.name AS categoryName,
    requester.id AS requesterId,
    requester.name AS requesterName,
    reviewer.id AS assignedReviewerId,
    reviewer.name AS assignedReviewerName
  FROM requests r
  JOIN categories c ON c.id = r.category_id
  JOIN users requester ON requester.id = r.requester_id
  LEFT JOIN users reviewer ON reviewer.id = r.assigned_reviewer_id
`;

export function listVisibleRequests(db, user) {
  const visibility = visibilityClause(user);
  return db.prepare(`
    ${requestSelect}
    WHERE ${visibility.sql}
    ORDER BY r.created_at DESC, r.id DESC
  `).all(...visibility.params);
}

export function getVisibleRequest(db, user, requestId) {
  const id = Number(requestId);
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "INVALID_REQUEST_ID", "Request ID must be a number.");
  }

  const request = db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
  if (!request) {
    throw new HttpError(404, "REQUEST_NOT_FOUND", "Request not found.");
  }

  const allowed = user.role === "admin"
    || (user.role === "employee" && request.requesterId === user.id)
    || (user.role === "reviewer" && request.assignedReviewerId === user.id);

  if (!allowed) {
    throw new HttpError(403, "REQUEST_FORBIDDEN", "You cannot view this request.");
  }

  return request;
}

export function cancelRequest(db, user, requestId) {
  const id = Number(requestId);
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "INVALID_REQUEST_ID", "Request ID must be a number.");
  }

  const request = db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
  if (!request) {
    throw new HttpError(404, "REQUEST_NOT_FOUND", "Request not found.");
  }

  if (request.requesterId !== user.id) {
    throw new HttpError(403, "REQUEST_FORBIDDEN", "You cannot cancel this request.");
  }

  if (request.status !== "Submitted") {
    throw new HttpError(409, "REQUEST_NOT_CANCELLABLE", "Only a submitted request can be cancelled.");
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE requests SET status = 'Cancelled', updated_at = ? WHERE id = ?`).run(now, id);

  return db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
}

function visibilityClause(user) {
  if (user.role === "admin") return { sql: "1 = 1", params: [] };
  if (user.role === "reviewer") {
    return { sql: "r.assigned_reviewer_id = ?", params: [user.id] };
  }
  return { sql: "r.requester_id = ?", params: [user.id] };
}
