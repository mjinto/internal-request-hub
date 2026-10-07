import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import RequestDetails from "./RequestDetails.jsx";

afterEach(cleanup);

const baseRequest = {
  id: 101,
  title: "Additional monitor",
  description: "A second monitor is needed.",
  priority: "Medium",
  status: "Submitted",
  reviewerComment: null,
  createdAt: "2026-09-15T09:20:00Z",
  updatedAt: "2026-09-15T09:20:00Z",
  categoryId: 1,
  categoryName: "Equipment",
  requesterId: 1,
  requesterName: "Maya Nair",
  assignedReviewerId: 3,
  assignedReviewerName: "Priya Menon",
};

test("AC-8: shows the Cancel button when the viewer is the requester and the request is submitted", () => {
  render(<RequestDetails request={baseRequest} currentUserId={1} onCancel={() => {}} />);
  expect(screen.getByRole("button", { name: "Cancel request" })).toBeInTheDocument();
});

test("AC-8: clicking Cancel request calls the onCancel callback", () => {
  const onCancel = vi.fn();
  render(<RequestDetails request={baseRequest} currentUserId={1} onCancel={onCancel} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));
  expect(onCancel).toHaveBeenCalledOnce();
});

test("AC-9: hides the Cancel button when the viewer is not the requester", () => {
  render(<RequestDetails request={baseRequest} currentUserId={2} onCancel={() => {}} />);
  expect(screen.queryByRole("button", { name: "Cancel request" })).not.toBeInTheDocument();
});

test("AC-9: hides the Cancel button when the request is not submitted", () => {
  render(
    <RequestDetails
      request={{ ...baseRequest, status: "Approved" }}
      currentUserId={1}
      onCancel={() => {}}
    />,
  );
  expect(screen.queryByRole("button", { name: "Cancel request" })).not.toBeInTheDocument();
});
