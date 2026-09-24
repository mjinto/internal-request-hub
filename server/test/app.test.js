import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { getCurrentUser } from "../src/current-user.js";
import { createDatabase } from "../src/db.js";
import { getVisibleRequest, listVisibleRequests } from "../src/requests.js";

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
