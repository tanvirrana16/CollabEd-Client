import React, { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaUserEdit, FaSearch, FaUsersCog, FaTrashAlt } from "react-icons/fa";
import useFetchApi from "../../../Api/useFetchApi";
import { SuccessToast, ErrorToast } from "../../../utils/ToastMaker";
import { AuthContext } from "../../../main";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import LoadingCenter from "../../Others/LoadingCenter";

const ManageUsers = () => {
  const { getAllUsers, updateUserRole, deleteUser } = useFetchApi();
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const limit = 10;

  const { data = {}, isLoading } = useQuery({
    queryKey: ["users", searchText, currentPage],
    queryFn: () => getAllUsers(searchText, currentPage, limit, user.email),
    keepPreviousData: true,
  });

  const users = data.users || [];
  const total = data.total || 0;
  const totalPages = Math.ceil(total / limit);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role, user.email),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      SuccessToast("Role updated successfully");
    },
    onError: () => ErrorToast("Failed to update role"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id, user.email),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      SuccessToast("User deleted successfully");
      setConfirmDeleteId(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || "Failed to delete user";
      ErrorToast(msg);
      setConfirmDeleteId(null);
    },
  });

  return (
    <SectionContainer className="customGradiant3 min-h-screen">
      <h2 className="text-4xl font-bold text-center mb-6 flex justify-center items-center gap-2 text-green-500">
        <FaUsersCog /> Manage Users
      </h2>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 max-w-md mx-auto">
        <FaSearch className="text-base-content/40" />
        <input
          type="text"
          placeholder="Search by name or email"
          className="input input-bordered w-full"
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-primary rounded-2xl">
        <table className="table table-zebra bg-base-100 rounded-box">
          <thead className="bg-primary/10">
            <tr className="text-base">
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-center">Change Role</th>
              <th className="text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="text-center py-6"><LoadingCenter /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-6">No users found</td></tr>
            ) : (
              users.map((u, index) => (
                <tr key={u._id}>
                  <td>{(currentPage - 1) * limit + index + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-10 w-10">
                          <img src={u.image || "https://via.placeholder.com/150"} alt={u.userName} />
                        </div>
                      </div>
                      <div className="font-bold">{u.userName}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td className="capitalize">
                    <span className={`badge badge-outline ${u.userRole === "Admin" ? "badge-error" :
                        u.userRole === "Tutor" ? "badge-warning" : "badge-info"
                      }`}>{u.userRole}</span>
                  </td>
                  <td className="text-center">
                    <select
                      className="select select-bordered select-sm"
                      value={u.userRole}
                      onChange={(e) => roleMutation.mutate({ id: u._id, role: e.target.value })}
                    >
                      <option value="Student">Student</option>
                      <option value="Tutor">Tutor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="text-center">
                    {u.email === user.email ? (
                      <span className="text-xs text-base-content/40 italic">You</span>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline btn-error gap-1"
                        onClick={() => setConfirmDeleteId(u._id)}
                      >
                        <FaTrashAlt /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`btn btn-sm ${currentPage === num ? "btn-primary" : "btn-outline"}`}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="modal modal-open z-50">
          <div className="modal-box rounded-xl border border-error">
            <h3 className="font-bold text-lg text-error">⚠️ Delete User?</h3>
            <p className="py-4 text-base-content/70">
              This action is permanent and cannot be undone. The user's account will be removed from the platform.
            </p>
            <div className="modal-action gap-3">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="btn btn-error"
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default ManageUsers;
