import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../../main";
import useFetchApi from "../../../Api/useFetchApi";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import Loading from "../../Others/Loading";
import { FaFilter, FaMoneyCheckAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const LIMIT = 10;
const STATUS_OPTIONS = ["", "succeeded", "failed", "pending"];

const AdminPayments = () => {
    const { user } = useContext(AuthContext);
    const { getAdminPayments, fetchTutors } = useFetchApi();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        tutorEmail: "",
        status: "",
        from: "",
        to: "",
    });
    const [applied, setApplied] = useState({});

    // Tutor list for the filter dropdown
    const { data: tutors = [] } = useQuery({
        queryKey: ["allTutors"],
        queryFn: fetchTutors,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["adminPayments", user?.email, applied, page],
        queryFn: () => getAdminPayments(user?.email, applied, page, LIMIT),
        enabled: !!user?.email,
        keepPreviousData: true,
    });

    const payments = data?.payments || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    const handleApply = () => {
        setApplied({ ...filters });
        setPage(1);
    };

    const handleReset = () => {
        const empty = { tutorEmail: "", status: "", from: "", to: "" };
        setFilters(empty);
        setApplied({});
        setPage(1);
    };

    const fmt = (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

    const badge = (status) => {
        const map = {
            succeeded: "badge badge-success",
            failed: "badge badge-error",
            pending: "badge badge-warning",
        };
        return map[status] || "badge badge-ghost";
    };

    return (
        <SectionContainer className="customGradiant3 min-h-screen">
            <h1 className="text-3xl lg:text-4xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                <FaMoneyCheckAlt className="text-primary" /> Payment History
            </h1>

            {/* ── Filters ── */}
            <div className="customGradiant2 border-2 border-primary rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaFilter className="text-primary" /> Filters
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filter by Teacher */}
                    <select
                        className="select select-bordered w-full"
                        value={filters.tutorEmail}
                        onChange={(e) => setFilters((f) => ({ ...f, tutorEmail: e.target.value }))}
                    >
                        <option value="">All Teachers</option>
                        {tutors.map((t) => (
                            <option key={t._id} value={t.email}>
                                {t.userName} ({t.email})
                            </option>
                        ))}
                    </select>

                    {/* Filter by Status */}
                    <select
                        className="select select-bordered w-full"
                        value={filters.status}
                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}</option>
                        ))}
                    </select>

                    {/* Date From */}
                    <div>
                        <label className="label label-text text-xs">From Date</label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={filters.from}
                            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="label label-text text-xs">To Date</label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={filters.to}
                            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button className="btn btn-primary" onClick={handleApply}>Apply Filters</button>
                    <button className="btn btn-ghost" onClick={handleReset}>Reset</button>
                </div>
            </div>

            {/* ── Summary strip ── */}
            <p className="text-sm text-base-content/60 mb-3">
                Showing <strong>{payments.length}</strong> of <strong>{total}</strong> records
                {Object.values(applied).some(Boolean) ? " (filtered)" : ""}
            </p>

            {/* ── Table ── */}
            {isLoading ? (
                <Loading />
            ) : payments.length === 0 ? (
                <div className="customGradiant2 rounded-xl border-2 border-primary p-16 text-center text-base-content/50">
                    No payments found for the selected filters.
                </div>
            ) : (
                <div className="customGradiant2 border-2 border-primary rounded-xl overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-primary/10 text-base">
                                <th>#</th>
                                <th>Student</th>
                                <th>Teacher</th>
                                <th>Course</th>
                                <th>Total</th>
                                <th>Admin 20%</th>
                                <th>Teacher 80%</th>
                                <th>Method</th>
                                <th>Tx ID</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, i) => (
                                <tr key={p._id} className="hover">
                                    <td>{(page - 1) * LIMIT + i + 1}</td>
                                    <td>
                                        <div className="font-medium">{p.studentName}</div>
                                        <div className="text-xs text-base-content/50">{p.studentEmail}</div>
                                    </td>
                                    <td>
                                        <div className="font-medium">{p.tutorName}</div>
                                        <div className="text-xs text-base-content/50">{p.tutorEmail}</div>
                                    </td>
                                    <td className="max-w-[160px] truncate" title={p.sessionTitle}>
                                        {p.sessionTitle}
                                    </td>
                                    <td className="font-semibold text-primary">${p.totalAmount}</td>
                                    <td className="text-emerald-600 font-medium">${p.adminShare}</td>
                                    <td className="text-amber-600 font-medium">${p.tutorShare}</td>
                                    <td className="capitalize">{p.paymentMethod}</td>
                                    <td>
                                        <span className="font-mono text-xs text-base-content/60" title={p.transactionId}>
                                            {p.transactionId ? p.transactionId.slice(0, 14) + "…" : "—"}
                                        </span>
                                    </td>
                                    <td className="text-xs whitespace-nowrap">{fmt(p.paidAt)}</td>
                                    <td><span className={badge(p.paymentStatus)}>{p.paymentStatus}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="text-sm">
                        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}
        </SectionContainer>
    );
};

export default AdminPayments;
