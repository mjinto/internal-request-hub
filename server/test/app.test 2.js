import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";

let db;
let server;
let baseUrl;

before(async () => {
  db = createDatabase(":memory:");
  server = createApp({ db }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

describe("health", () => {
  it("reports that the API is available", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

describe("request visibility", () => {
  it("shows an employee only their requests", async () => {
    const response = await fetch(`${baseUrl}/api/requests?currentUserId=1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.map((request) => request.id), [105, 101, 102]);
    assert.ok(body.data.every((request) => request.requesterId === 1));
  });

  it("shows a reviewer only assigned requests", async () => {
    const response = await fetch(`${baseUrl}/api/requests?currentUserId=3`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.map((request) => request.id), [103, 101]);
    assert.ok(body.data.every((request) => request.assignedReviewerId === 3));
  });

  it("shows an administrator all requests", async () => {
    const response = await fetch(`${baseUrl}/api/requests?currentUserId=5`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 5);
  });

  it("rejects access to a request outside the user's view", async () => {
    const response = await fetch(`${baseUrl}/api/requests/103?currentUserId=1`);
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, "REQUEST_FORBIDDEN");
  });

  it("returns a clear error when the current user is missing", async () => {
    const response = await fetch(`${baseUrl}/api/requests`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "CURRENT_USER_REQUIRED");
  });
});
