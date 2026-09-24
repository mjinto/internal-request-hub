import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  vi.restoreAllMocks();
});

test("loads the employee request workspace", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url === "/api/users") {
      return jsonResponse({
        data: [{ id: 1, name: "Maya Nair", email: "maya@example.test", role: "employee" }],
      });
    }
    if (url === "/api/requests?currentUserId=1") {
      return jsonResponse({
        data: [{
          id: 101,
          title: "Additional monitor",
          categoryName: "Equipment",
          priority: "Medium",
          status: "Submitted",
        }],
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  }));

  render(<App />);

  expect(await screen.findByRole("heading", { name: "My requests" })).toBeInTheDocument();
  expect(await screen.findByText("Additional monitor")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
