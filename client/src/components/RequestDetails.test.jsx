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

test("AC-10: shows Approve and Reject controls when the viewer is the assigned reviewer and the request is submitted", () => {
  render(<RequestDetails request={baseRequest} currentUserId={3} onApprove={() => {}} onReject={() => {}} />);
  expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
});

test("AC-10: clicking Approve calls the onApprove callback", () => {
  const onApprove = vi.fn();
  render(<RequestDetails request={baseRequest} currentUserId={3} onApprove={onApprove} onReject={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  expect(onApprove).toHaveBeenCalledOnce();
});

test("AC-10: the Reject button is disabled until a comment is entered, then calls onReject with it", () => {
  const onReject = vi.fn();
  render(<RequestDetails request={baseRequest} currentUserId={3} onApprove={() => {}} onReject={onReject} />);

  const rejectButton = screen.getByRole("button", { name: "Reject" });
  expect(rejectButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Reviewer comment (required to reject)"), {
    target: { value: "Needs more detail." },
  });
  expect(rejectButton).not.toBeDisabled();

  fireEvent.click(rejectButton);
  expect(onReject).toHaveBeenCalledWith("Needs more detail.");
});

test("AC-11: hides Approve/Reject controls when the viewer is not the assigned reviewer", () => {
  render(<RequestDetails request={baseRequest} currentUserId={5} onApprove={() => {}} onReject={() => {}} />);
  expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
});

test("AC-11: hides Approve/Reject controls when the request is not submitted", () => {
  render(
    <RequestDetails
      request={{ ...baseRequest, status: "Approved" }}
      currentUserId={3}
      onApprove={() => {}}
      onReject={() => {}}
    />,
  );
  expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
});
