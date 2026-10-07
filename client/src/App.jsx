import { useEffect, useMemo, useState } from "react";
import { cancelRequest, loadRequest, loadRequests, loadUsers } from "./api.js";
import RequestDetails from "./components/RequestDetails.jsx";
import RequestList from "./components/RequestList.jsx";
import UserSwitcher from "./components/UserSwitcher.jsx";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId),
    [users, currentUserId],
  );

  useEffect(() => {
    loadUsers()
      .then((loadedUsers) => {
        setUsers(loadedUsers);
        setCurrentUserId(loadedUsers[0]?.id ?? null);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    setError("");
    setSelectedRequest(null);
    loadRequests(currentUserId)
      .then(setRequests)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  async function openRequest(requestId) {
    try {
      setError("");
      setSelectedRequest(await loadRequest(requestId, currentUserId));
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function cancelSelectedRequest() {
    try {
      setError("");
      setSelectedRequest(await cancelRequest(selectedRequest.id, currentUserId));
      setRequests(await loadRequests(currentUserId));
    } catch (cancelError) {
      setError(cancelError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Request Hub home">
          <span className="brand-mark" aria-hidden="true">RH</span>
          <span>
            <strong>Request Hub</strong>
            <small>Internal services</small>
          </span>
        </a>
        <UserSwitcher
          users={users}
          currentUserId={currentUserId}
          onChange={setCurrentUserId}
        />
      </header>

      <main id="top">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{headingFor(currentUser)}</h1>
            <p>{descriptionFor(currentUser)}</p>
          </div>
          {currentUser && <span className="role-chip">{currentUser.role}</span>}
        </section>

        {error && <div className="notice notice-error" role="alert">{error}</div>}

        <div className="content-grid">
          <RequestList
            requests={requests}
            loading={loading}
            selectedId={selectedRequest?.id}
            onSelect={openRequest}
          />
          <RequestDetails
            request={selectedRequest}
            currentUserId={currentUserId}
            onCancel={cancelSelectedRequest}
          />
        </div>
      </main>
    </div>
  );
}

function headingFor(user) {
  if (!user) return "Requests";
  if (user.role === "reviewer") return "Assigned requests";
  if (user.role === "admin") return "All requests";
  return "My requests";
}

function descriptionFor(user) {
  if (!user) return "Loading your workspace.";
  if (user.role === "reviewer") return "Review the requests currently assigned to you.";
  if (user.role === "admin") return "View request activity across the organization.";
  return "Track requests you have submitted to internal teams.";
}
