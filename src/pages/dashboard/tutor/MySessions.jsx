import React, { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../../main";
import {
  FaCheckCircle, FaClock, FaSyncAlt, FaTimesCircle, FaEdit, FaCalendarAlt,
} from "react-icons/fa";
import useFetchApi from "../../../Api/useFetchApi";
import { ErrorToast, SuccessToast } from "../../../utils/ToastMaker";
import { Link } from "react-router";
import Loading from "../../Others/Loading";
import { MdOutlineMenuBook } from "react-icons/md";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";

const EMPTY_EDIT = {
  title: "", description: "", registrationStart: "", registrationEnd: "",
  classStart: "", classEnd: "", duration: "",
};

const MySession = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { mySession, resendApprovalRequest, tutorUpdateRejectedSession } = useFetchApi();

  // Edit modal state (only for rejected sessions)
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["mySessions", user?.email],
    queryFn: () => mySession(user?.email),
    enabled: !!user?.email,
  });

  // ── Resubmit (change status back to "pending") ──
  const handleResendRequest = (id) => {
    resendApprovalRequest(id, user.email)
      .then((res) => {
        if (res.modifiedCount > 0) {
          SuccessToast("Approval request resubmitted!");
          queryClient.invalidateQueries(["mySessions", user?.email]);
        } else {
          ErrorToast("Failed to resubmit.");
        }
      })
      .catch(() => ErrorToast("Error resubmitting request."));
  };

  // ── Open Edit Modal ──
  const openEditModal = (session) => {
    setEditingSession(session);
    setEditForm({
      title: session.title || "",
      description: session.description || "",
      registrationStart: session.registrationStart || "",
      registrationEnd: session.registrationEnd || "",
      classStart: session.classStart || "",
      classEnd: session.classEnd || "",
      duration: session.duration || "",
    });
    setShowEditModal(true);
  };

  // ── Save Edits ──
  const updateMutation = useMutation({
    mutationFn: () =>
      tutorUpdateRejectedSession(editingSession._id, user.email, editForm),
    onSuccess: (res) => {
      if (res.modifiedCount > 0) {
        SuccessToast("Session updated! You can now resubmit it.");
        queryClient.invalidateQueries(["mySessions", user?.email]);
      }
      setShowEditModal(false);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || "Failed to update session.";
      ErrorToast(msg);
    },
  });

  if (isLoading) return <Loading />;

  return (
    <SectionContainer className="customGradiant3 min-h-screen">
      <h2 className="text-4xl font-bold mb-6 text-center flex items-center justify-center gap-2 text-purple-500">
        <MdOutlineMenuBook /> My Study Sessions
      </h2>

      {sessions.length === 0 ? (
        <p className="text-center text-base-content/60 py-16">
          You haven't created any sessions yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session._id} className="card boxCss customGradiant2">
              <div className="card-body space-y-4">
                {/* Title */}
                <h3 className="card-title text-lg md:text-xl font-semibold">
                  <FaCheckCircle className="text-primary" />
                  {session.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-base-content/80 leading-relaxed">
                  {session.description?.slice(0, 120)}...
                </p>

                {/* Status Badge */}
                <div className="text-sm font-medium flex items-center gap-2">
                  <span className="text-base-content/70">Status:</span>
                  <span className={`badge px-3 py-1 text-sm capitalize flex items-center gap-1 ${session.status === "approved" ? "badge-success" :
                      session.status === "rejected" ? "badge-error" : "badge-warning"
                    }`}>
                    {session.status === "approved" && <FaCheckCircle />}
                    {session.status === "rejected" && <FaTimesCircle />}
                    {session.status === "pending" && <FaClock />}
                    {session.status}
                  </span>
                </div>

                {/* Rejection Feedback Panel */}
                {session.status === "rejected" && (session.rejectionReason || session.rejectionFeedback) && (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-4 space-y-2 text-sm text-error">
                    <p className="font-semibold text-base flex items-center gap-1">
                      <FaTimesCircle /> Admin Feedback
                    </p>
                    {session.rejectionReason && (
                      <p><span className="font-medium">Reason:</span> {session.rejectionReason}</p>
                    )}
                    {session.rejectionFeedback && (
                      <p><span className="font-medium">Feedback:</span> {session.rejectionFeedback}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Rejected: Update + Resubmit */}
                  {session.status === "rejected" && (
                    <>
                      {/* Update button — edit the session before resubmitting */}
                      <button
                        onClick={() => openEditModal(session)}
                        className="btn btn-sm btn-outline btn-primary flex items-center gap-2"
                      >
                        <FaEdit /> Update Session
                      </button>

                      {/* Resubmit for approval */}
                      <button
                        onClick={() => handleResendRequest(session._id)}
                        className="btn btn-sm btn-outline btn-warning flex items-center gap-2"
                      >
                        <FaSyncAlt className="text-warning" /> Resubmit
                      </button>
                    </>
                  )}

                  {/* Approved: upload materials */}
                  {session.status === "approved" && (
                    <Link to={`/tutorDashboard/uploadMaterials/${session._id}`}>
                      <button className="btn btn-sm btn-outline btn-primary flex items-center gap-2 rounded-xl">
                        Upload Materials
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Update Modal (rejected sessions only) ── */}
      {showEditModal && editingSession && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-2xl rounded-xl border border-primary overflow-y-auto max-h-[92vh]">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-1">
              <FaEdit /> Edit Rejected Session
            </h3>
            <p className="text-xs text-base-content/50 mb-4 italic">
              Update your session details and then use "Resubmit" to send it back for approval.
              Registration fee cannot be changed here.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Session Title", key: "title", type: "text" },
                { label: "Duration", key: "duration", type: "text" },
                { label: "Registration Start", key: "registrationStart", type: "date" },
                { label: "Registration End", key: "registrationEnd", type: "date" },
                { label: "Class Start", key: "classStart", type: "date" },
                { label: "Class End", key: "classEnd", type: "date" },
              ].map(({ label, key, type }) => (
                <div className="form-control" key={key}>
                  <label className="label text-sm font-semibold">
                    <span className="label-text flex items-center gap-1">
                      <FaCalendarAlt className="text-primary text-xs" /> {label}
                    </span>
                  </label>
                  <input
                    type={type}
                    className="input input-bordered input-sm"
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="form-control md:col-span-2">
                <label className="label text-sm font-semibold">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered min-h-[90px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-action mt-5 gap-3">
              <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
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
    </SectionContainer>
  );
};

export default MySession;
