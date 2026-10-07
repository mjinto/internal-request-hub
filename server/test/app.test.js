import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { getCurrentUser } from "../src/current-user.js";
import { createDatabase } from "../src/db.js";
import { cancelRequest, getVisibleRequest, listVisibleRequests } from "../src/requests.js";

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

function snapshot(id) {
  return db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
}
