import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../../main";
import useFetchApi from "../../../Api/useFetchApi";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import Loading from "../../Others/Loading";
import {
    FaWallet, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";


const LIMIT = 10;



/* ── Main component ──────────────────────────────────────────────── */
const TutorPayments = () => {
    const { user } = useContext(AuthContext);
    const { getTutorPayments } = useFetchApi();

    const [page, setPage] = useState(1);

    /* Paginated payment list */
    const { data, isLoading } = useQuery({
        queryKey: ["tutorPayments", user?.email, page],
        queryFn: () => getTutorPayments(user?.email, page, LIMIT),
        enabled: !!user?.email,
        keepPreviousData: true,
    });

    const payments = data?.payments || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    const fmt = (dateStr) =>
        dateStr
            ? new Date(dateStr).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
            : "—";

    return (
        <SectionContainer className="customGradiant3 min-h-screen">

            {/* ── Page title ── */}
            <h1 className="text-3xl lg:text-4xl font-bold text-center mb-6 flex items-center justify-center gap-3">
                <FaWallet className="text-primary" /> My Earnings History
            </h1>


            {/* ── Payment Table ── */}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaWallet className="text-primary" /> Payment Records
            </h2>
            <p className="text-sm text-base-content/60 mb-4">
                Showing <strong>{payments.length}</strong> of <strong>{total}</strong> payment records for your sessions.
            </p>

            {isLoading ? (
                <Loading />
            ) : payments.length === 0 ? (
                <div className="customGradiant2 rounded-xl border-2 border-primary p-16 text-center text-base-content/50">
                    No student payments found yet. Once a student enrolls in your session, their payment will appear here.
                </div>
            ) : (
                <div className="customGradiant2 border-2 border-primary rounded-xl overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-primary/10 text-base">
                                <th>#</th>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Amount Paid</th>
                                <th>My Earnings (80%)</th>
                                <th>Admin Share (20%)</th>
                                <th>Payment Date</th>
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
                                    <td className="max-w-[180px] truncate" title={p.sessionTitle}>
                                        {p.sessionTitle}
                                    </td>
                                    <td className="font-semibold text-primary">${p.totalAmount}</td>
                                    <td className="text-amber-600 font-bold">${p.tutorShare}</td>
                                    <td className="text-base-content/50">${p.adminShare}</td>
                                    <td className="text-xs whitespace-nowrap">{fmt(p.paidAt)}</td>
                                    <td>
                                        <span
                                            className={
                                                p.paymentStatus === "succeeded"
                                                    ? "badge badge-success"
                                                    : p.paymentStatus === "failed"
                                                        ? "badge badge-error"
                                                        : "badge badge-warning"
                                            }
                                        >
                                            {p.paymentStatus}
                                        </span>
                                    </td>
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

export default TutorPayments;
