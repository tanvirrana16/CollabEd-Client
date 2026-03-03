import React, { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useFetchApi from "../../../Api/useFetchApi";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { MdPendingActions, MdVerified } from "react-icons/md";
import Loading from "../../Others/Loading";
import { ErrorToast, SuccessToast } from "../../../utils/ToastMaker";
import { AuthContext } from "../../../main";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import {
  FaCalendarAlt, FaChalkboardTeacher, FaCheckCircle,
  FaEnvelope, FaMoneyBillWave, FaTimesCircle, FaUser, FaEdit, FaTrashAlt,
} from "react-icons/fa";

const EMPTY_EDIT = {
  title: "", description: "", tutorName: "", tutorEmail: "",
  registrationStart: "", registrationEnd: "", classStart: "", classEnd: "", duration: "",
};

const ManageSessions = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [amount, setAmount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [rejectingId, setRejectingId] = useState(null);

  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const queryClient = useQueryClient();
  const { getAllSessions, approveSession, rejectSession, deleteSession, updateSession, safeDeleteSession } = useFetchApi();
  const { user } = useContext(AuthContext);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => getAllSessions(user.email),
  });

  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const approvedSessions = sessions.filter((s) => s.status === "approved");

  /* ─── Approve ─── */
  const handleApproveClick = (session) => { setSelectedSession(session); setShowModal(true); };
  const handleApproveSubmit = () => {
    approveSession({ id: selectedSession._id, amount: isPaid ? amount : 0 }, user.email)
      .then(() => { SuccessToast("Session approved"); queryClient.invalidateQueries(["allSessions"]); setShowModal(false); })
      .catch(() => ErrorToast("Failed to approve"));
  };

  /* ─── Reject ─── */
  const handleReject = (id) => { setRejectingId(id); setShowRejectModal(true); };
  const handleRejectSubmit = () => {
    rejectSession(rejectingId, { reason: rejectReason, feedback: rejectFeedback }, user.email)
      .then(() => {
        SuccessToast("Session rejected"); queryClient.invalidateQueries(["allSessions"]);
        setShowRejectModal(false); setRejectFeedback(""); setRejectReason(""); setRejectingId(null);
      })
      .catch(() => ErrorToast("Failed to reject session"));
  };

  /* ─── Update modal ─── */
  const openUpdateModal = (session) => {
    setEditingSession(session);
    setEditForm({
      title: session.title || "",
      description: session.description || "",
      tutorName: session.tutorName || "",
      tutorEmail: session.tutorEmail || "",
      registrationStart: session.registrationStart || "",
      registrationEnd: session.registrationEnd || "",
      classStart: session.classStart || "",
      classEnd: session.classEnd || "",
      duration: session.duration || "",
    });
    setShowUpdateModal(true);
  };

  const updateMutation = useMutation({
    mutationFn: () => updateSession(editingSession._id, user.email, editForm),
    onSuccess: () => {
      SuccessToast("Session updated successfully");
      queryClient.invalidateQueries(["allSessions"]);
      setShowUpdateModal(false);
    },
    onError: () => ErrorToast("Failed to update session"),
  });

  /* ─── Safe Delete ─── */
  const safeDeleteMutation = useMutation({
    mutationFn: (id) => safeDeleteSession(id, user.email),
    onSuccess: () => {
      SuccessToast("Session deleted");
      queryClient.invalidateQueries(["allSessions"]);
      setConfirmDeleteId(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || "Failed to delete session";
      ErrorToast(msg);
      setConfirmDeleteId(null);
    },
  });

  // Pending tab still uses original deleteSession (no enrolment check needed — pending sessions can't have bookings)
  const handleDeletePending = (id) => {
    deleteSession(id, user.email)
      .then(() => { SuccessToast("Session deleted"); queryClient.invalidateQueries(["allSessions"]); })
      .catch(() => ErrorToast("Failed to delete"));
  };

  if (isLoading) return <Loading />;

  /* ─── Session Card ─── */
  const SessionCard = ({ session, actions }) => (
    <div className="card customGradiant2 border-2 border-primary rounded-2xl shadow-primary hover:shadow-sm transition-shadow duration-300">
      <div className="card-body space-y-3">
        <h3 className="text-lg font-semibold text-primary">{session.title}</h3>
        <div className="space-y-1 text-sm">
          <p className="flex gap-2 items-center"><FaUser /> <span className="font-medium">Tutor:</span> {session.tutorName}</p>
          <p className="flex gap-2 items-center"><FaEnvelope /> {session.tutorEmail}</p>
        </div>
        <div className="text-sm space-y-1">
          <p className="flex items-center gap-2"><FaCalendarAlt /> <span className="font-medium">Registration:</span> {session.registrationStart} → {session.registrationEnd}</p>
          <p className="flex items-center gap-2"><FaCalendarAlt /> <span className="font-medium">Class:</span> {session.classStart} → {session.classEnd}</p>
          <p className="flex items-center gap-2"><FaCalendarAlt /> <span className="font-medium">Duration:</span> {session.duration}</p>
          <p className="flex items-center gap-2">
            <FaMoneyBillWave />
            <span className="font-medium">Fee:</span>{" "}
            {parseFloat(session.registrationFee) > 0 ? `$${session.registrationFee}` : "Free"}
          </p>
        </div>
        <p className="text-base-content/80 line-clamp-4 text-justify text-sm">{session.description}</p>
        <div className="flex gap-2 flex-wrap pt-1">{actions}</div>
      </div>
    </div>
  );

  return (
    <SectionContainer className="customGradiant3 min-h-screen">
      <h2 className="text-4xl font-bold text-center mb-6 text-purple-500 flex items-center justify-center gap-3">
        <FaChalkboardTeacher /> Manage Sessions
      </h2>

      <Tabs>
        <TabList className="flex justify-center gap-6 mb-8">
          <Tab className="tab tab-bordered text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-all hover:bg-base-200 react-tabs__tab">
            <MdPendingActions className="text-xl text-warning" /> Pending Sessions
          </Tab>
          <Tab className="tab tab-bordered text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-all hover:bg-base-200 react-tabs__tab">
            <MdVerified className="text-xl text-success" /> Approved Sessions
          </Tab>
        </TabList>

        {/* Pending */}
        <TabPanel>
          {pendingSessions.length === 0 ? (
            <p className="text-center text-base-content/70">No pending sessions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSessions.map((session) => (
                <SessionCard key={session._id} session={session} actions={
                  <>
                    <button onClick={() => handleApproveClick(session)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition">
                      <FaCheckCircle /> Approve
                    </button>
                    <button onClick={() => handleReject(session._id)} className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white transition">
                      <FaTimesCircle /> Reject
                    </button>
                    <button onClick={() => handleDeletePending(session._id)} className="btn btn-sm btn-outline btn-error gap-1">
                      <FaTrashAlt /> Delete
                    </button>
                  </>
                } />
              ))}
            </div>
          )}
        </TabPanel>

        {/* Approved */}
        <TabPanel>
          {approvedSessions.length === 0 ? (
            <p className="text-center text-base-content/70">No approved sessions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedSessions.map((session) => (
                <SessionCard key={session._id} session={session} actions={
                  <>
                    <button onClick={() => openUpdateModal(session)} className="btn btn-sm btn-primary gap-1">
                      <FaEdit /> Update
                    </button>
                    <button onClick={() => setConfirmDeleteId(session._id)} className="btn btn-sm btn-outline btn-error gap-1">
                      <FaTrashAlt /> Delete
                    </button>
                  </>
                } />
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>

      {/* ── Approve Modal ── */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box space-y-4">
            <h3 className="font-bold text-lg">Approve Session</h3>
            <div className="form-control">
              <label className="label"><span className="label-text">Is this session paid?</span></label>
              <select className="select select-bordered" value={isPaid ? "paid" : "free"} onChange={(e) => setIsPaid(e.target.value === "paid")}>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {isPaid && (
              <div className="form-control">
                <label className="label"><span className="label-text">Amount ($)</span></label>
                <input type="number" className="input input-bordered" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            )}
            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleApproveSubmit}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box rounded-xl border border-error max-w-xl">
            <h3 className="text-xl font-bold text-error flex items-center gap-2"><FaTimesCircle /> Reject Session</h3>
            <p className="text-sm text-base-content/70 mb-4">Please provide a reason for rejecting this session.</p>
            <div className="form-control w-full">
              <label className="label"><span className="label-text">Rejection Reason <span className="text-error">*</span></span></label>
              <input type="text" className="input input-bordered input-error" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Incomplete session details" />
            </div>
            <div className="form-control w-full mt-4">
              <label className="label"><span className="label-text">Feedback (optional)</span></label>
              <textarea className="textarea textarea-bordered min-h-[90px]" value={rejectFeedback} onChange={(e) => setRejectFeedback(e.target.value)} placeholder="Any additional suggestions…" />
            </div>
            <div className="modal-action mt-6 gap-3">
              <button className="btn btn-ghost" onClick={() => { setShowRejectModal(false); setRejectFeedback(""); setRejectReason(""); setRejectingId(null); }}>Cancel</button>
              <button className="btn btn-error" onClick={handleRejectSubmit}>Submit Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update Modal ── */}
      {showUpdateModal && editingSession && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-2xl rounded-xl border border-primary overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-4"><FaEdit /> Update Session</h3>
            <p className="text-xs text-base-content/50 mb-4 italic">Note: Registration fee cannot be changed here.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Session Title", key: "title", type: "text" },
                { label: "Tutor Name", key: "tutorName", type: "text" },
                { label: "Tutor Email", key: "tutorEmail", type: "email" },
                { label: "Duration", key: "duration", type: "text" },
                { label: "Registration Start", key: "registrationStart", type: "date" },
                { label: "Registration End", key: "registrationEnd", type: "date" },
                { label: "Class Start", key: "classStart", type: "date" },
                { label: "Class End", key: "classEnd", type: "date" },
              ].map(({ label, key, type }) => (
                <div className="form-control" key={key}>
                  <label className="label text-sm font-semibold"><span className="label-text">{label}</span></label>
                  <input
                    type={type}
                    className="input input-bordered input-sm"
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="form-control md:col-span-2">
                <label className="label text-sm font-semibold"><span className="label-text">Description</span></label>
                <textarea
                  className="textarea textarea-bordered min-h-[90px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-action mt-6 gap-3">
              <button className="btn btn-ghost" onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Safe Delete Confirm Modal ── */}
      {confirmDeleteId && (
        <div className="modal modal-open z-50">
          <div className="modal-box rounded-xl border border-error">
            <h3 className="font-bold text-lg text-error">⚠️ Delete Session?</h3>
            <p className="py-3 text-base-content/70">
              This session will be permanently deleted. If any students are already enrolled, deletion will be blocked.
            </p>
            <div className="modal-action gap-3">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="btn btn-error"
                onClick={() => safeDeleteMutation.mutate(confirmDeleteId)}
                disabled={safeDeleteMutation.isLoading}
              >
                {safeDeleteMutation.isLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default ManageSessions;
