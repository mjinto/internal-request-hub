import StatusBadge from "./StatusBadge.jsx";

export default function RequestDetails({ request }) {
  if (!request) {
    return (
      <section className="panel detail-panel empty-detail" aria-live="polite">
        <div className="empty-icon" aria-hidden="true">↗</div>
        <h2>Select a request</h2>
        <p>Choose a request from the queue to see its complete details.</p>
      </section>
    );
  }

  return (
    <section className="panel detail-panel" aria-labelledby="request-detail-title">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">REQ-{request.id}</p>
          <h2 id="request-detail-title">{request.title}</h2>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="description">{request.description}</p>

      <dl className="detail-grid">
        <Detail label="Category" value={request.categoryName} />
        <Detail label="Priority" value={request.priority} />
        <Detail label="Requested by" value={request.requesterName} />
        <Detail label="Assigned reviewer" value={request.assignedReviewerName ?? "Not assigned"} />
        <Detail label="Created" value={formatDate(request.createdAt)} />
        <Detail label="Last updated" value={formatDate(request.updatedAt)} />
      </dl>

      {request.reviewerComment && (
        <div className="review-note">
          <strong>Reviewer comment</strong>
          <p>{request.reviewerComment}</p>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
