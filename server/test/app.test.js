import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { getCurrentUser } from "../src/current-user.js";
import { createDatabase } from "../src/db.js";
import {
  approveRequest,
  cancelRequest,
  getVisibleRequest,
  listVisibleRequests,
  rejectRequest,
} from "../src/requests.js";

let db;

before(() => {
  db = createDatabase(":memory:");
});

after(() => {
  db.close();
});

describe("current user", () => {
  it("loads an active user", () => {
    assert.deepEqual(getCurrentUser(db, 1), {
      id: 1,
      name: "Maya Nair",
      email: "maya.nair@example.test",
      role: "employee",
      active: true,
    });
  });

  it("requires a selected user", () => {
    assert.throws(
      () => getCurrentUser(db),
      (error) => error.status === 400 && error.code === "CURRENT_USER_REQUIRED",
    );
  });
});

describe("request visibility", () => {
  it("shows an employee only their requests", () => {
    const requests = listVisibleRequests(db, getCurrentUser(db, 1));

    assert.deepEqual(requests.map((request) => request.id), [105, 101, 102]);
    assert.ok(requests.every((request) => request.requesterId === 1));
  });

  it("shows a reviewer only assigned requests", () => {
    const requests = listVisibleRequests(db, getCurrentUser(db, 3));

    assert.deepEqual(requests.map((request) => request.id), [103, 101]);
    assert.ok(requests.every((request) => request.assignedReviewerId === 3));
  });

  it("shows an administrator all requests", () => {
    const requests = listVisibleRequests(db, getCurrentUser(db, 5));

    assert.equal(requests.length, 5);
  });

  it("rejects a request outside the user's view", () => {
    assert.throws(
      () => getVisibleRequest(db, getCurrentUser(db, 1), 103),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
  });
});

describe("cancel request", () => {
  // These tests intentionally run in order: denials first, while request
  // 101 is still Submitted, then the success case (which cancels 101),
  // then the already-cancelled rejection reuses that same mutation.

  it("denies a different employee from cancelling a submitted request", () => {
    const before = snapshot(101);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 2), 101),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(101), before);
  });

  it("denies the assigned reviewer from cancelling a submitted request", () => {
    const before = snapshot(101);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 3), 101),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(101), before);
  });

  it("denies an administrator from cancelling on the requester's behalf", () => {
    const before = snapshot(101);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 5), 101),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(101), before);
  });

  it("lets the requester cancel their own submitted request", () => {
    const result = cancelRequest(db, getCurrentUser(db, 1), 101);
    assert.equal(result.status, "Cancelled");
    assert.equal(snapshot(101).status, "Cancelled");
  });

  it("rejects cancelling a request that is already cancelled", () => {
    const before = snapshot(101);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 1), 101),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_CANCELLABLE",
    );
    assert.deepEqual(snapshot(101), before);
  });

  it("rejects cancelling a draft request", () => {
    const before = snapshot(105);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 1), 105),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_CANCELLABLE",
    );
    assert.deepEqual(snapshot(105), before);
  });

  it("rejects cancelling an approved request", () => {
    const before = snapshot(102);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 1), 102),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_CANCELLABLE",
    );
    assert.deepEqual(snapshot(102), before);
  });

  it("rejects cancelling a rejected request", () => {
    const before = snapshot(104);
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 2), 104),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_CANCELLABLE",
    );
    assert.deepEqual(snapshot(104), before);
  });

  it("rejects cancelling a request that does not exist", () => {
    assert.throws(
      () => cancelRequest(db, getCurrentUser(db, 1), 999),
      (error) => error.status === 404 && error.code === "REQUEST_NOT_FOUND",
    );
  });
});

describe("approve/reject request", () => {
  // Test-only fixtures, scoped to this describe block only (never added to
  // server/src/db.js's seed data): ids outside the seeded 101-105 range so
  // they can't collide with or shift the other describe blocks' fixtures
  // or counts. 201 covers the approve-success path (the only other
  // Submitted seed row, 103, is reserved below for the denial checks and
  // the reject-success path). 202 covers AC-7's Draft case, since no seed
  // row is both Draft and has a non-null assigned reviewer.
  before(() => {
    const insert = db.prepare(`
      INSERT INTO requests (
        id, title, description, category_id, requester_id, assigned_reviewer_id,
        priority, status, reviewer_comment, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      201, "Standing desk", "Test fixture for approve-success.", 1, 1, 3,
      "Low", "Submitted", null, "2026-09-21T09:00:00Z", "2026-09-21T09:00:00Z",
    );
    insert.run(
      202, "Draft fixture", "Test fixture for the Draft-with-reviewer AC-7 case.", 1, 1, 3,
      "Low", "Draft", null, "2026-09-21T09:00:00Z", "2026-09-21T09:00:00Z",
    );
  });

  it("denies a reviewer who isn't assigned to the request from approving it", () => {
    const before = snapshot(103);
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 4), 103),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(103), before);
  });

  it("denies the requester from deciding their own request", () => {
    const before = snapshot(103);
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 2), 103),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(103), before);
  });

  it("denies an administrator from deciding on the assigned reviewer's behalf", () => {
    const before = snapshot(103);
    assert.throws(
      () => rejectRequest(db, getCurrentUser(db, 5), 103, "Admin override attempt."),
      (error) => error.status === 403 && error.code === "REQUEST_FORBIDDEN",
    );
    assert.deepEqual(snapshot(103), before);
  });

  it("requires a non-empty comment to reject", () => {
    const before = snapshot(103);
    assert.throws(
      () => rejectRequest(db, getCurrentUser(db, 3), 103, "   "),
      (error) => error.status === 400 && error.code === "REJECTION_COMMENT_REQUIRED",
    );
    assert.deepEqual(snapshot(103), before);

    assert.throws(
      () => rejectRequest(db, getCurrentUser(db, 3), 103, undefined),
      (error) => error.status === 400 && error.code === "REJECTION_COMMENT_REQUIRED",
    );
    assert.deepEqual(snapshot(103), before);
  });

  it("lets the assigned reviewer reject a submitted request with a comment", () => {
    const result = rejectRequest(db, getCurrentUser(db, 3), 103, "  Needs more detail.  ");
    assert.equal(result.status, "Rejected");
    assert.equal(result.reviewerComment, "Needs more detail.");
    assert.equal(snapshot(103).status, "Rejected");
    assert.equal(snapshot(103).reviewer_comment, "Needs more detail.");
  });

  it("lets the assigned reviewer approve a submitted request", () => {
    const result = approveRequest(db, getCurrentUser(db, 3), 201);
    assert.equal(result.status, "Approved");
    assert.equal(snapshot(201).status, "Approved");
  });

  it("rejects deciding a request that is already rejected", () => {
    const before = snapshot(103);
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 3), 103),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_DECIDABLE",
    );
    assert.deepEqual(snapshot(103), before);
  });

  it("rejects deciding an approved request", () => {
    const before = snapshot(102);
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 4), 102),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_DECIDABLE",
    );
    assert.deepEqual(snapshot(102), before);
  });

  it("rejects deciding an already-rejected request", () => {
    const before = snapshot(104);
    assert.throws(
      () => rejectRequest(db, getCurrentUser(db, 4), 104, "Another comment."),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_DECIDABLE",
    );
    assert.deepEqual(snapshot(104), before);
  });

  it("rejects deciding a cancelled request", () => {
    const before = snapshot(101);
    assert.equal(before.status, "Cancelled");
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 3), 101),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_DECIDABLE",
    );
    assert.deepEqual(snapshot(101), before);
  });

  it("rejects deciding a draft request", () => {
    const before = snapshot(202);
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 3), 202),
      (error) => error.status === 409 && error.code === "REQUEST_NOT_DECIDABLE",
    );
    assert.deepEqual(snapshot(202), before);
  });

  it("rejects deciding a request that does not exist", () => {
    assert.throws(
      () => approveRequest(db, getCurrentUser(db, 3), 999),
      (error) => error.status === 404 && error.code === "REQUEST_NOT_FOUND",
    );
    assert.throws(
      () => rejectRequest(db, getCurrentUser(db, 3), 999, "Comment."),
      (error) => error.status === 404 && error.code === "REQUEST_NOT_FOUND",
    );
  });
});

function snapshot(id) {
  return db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
}
