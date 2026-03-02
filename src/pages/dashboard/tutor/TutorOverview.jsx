import React, { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaMoneyBillWave,
  FaHandHoldingUsd,
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AuthContext } from "../../../main";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import Loading from "../../Others/Loading";
import useFetchApi from "../../../Api/useFetchApi";

const StatCard = ({ icon, label, value, color }) => (
  <div className="customGradiant2 p-5 boxCss flex items-center gap-5">
    <span className={`text-4xl ${color || "text-primary"}`}>{icon}</span>
    <div>
      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide">{label}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  </div>
);

const TutorOverview = () => {
  const { user } = useContext(AuthContext);
  const { getTutorStats } = useFetchApi();

  const { data, isLoading } = useQuery({
    queryKey: ["tutorStats", user?.email],
    queryFn: () => getTutorStats(user?.email),
    enabled: !!user?.email,
  });

  if (isLoading) return <Loading />;

  const monthlyEarnings = data?.monthlyEarnings || [];

  return (
    <SectionContainer className="customGradiant3 min-h-screen">
      {/* Welcome */}
      <h1 className="text-3xl lg:text-5xl font-bold text-center mb-8">
        Welcome, <span className="text-primary">{user?.displayName || "Tutor"}</span>!
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<FaBook />} label="Sessions Sold" value={data?.totalSessions ?? 0} color="text-blue-500" />
        <StatCard icon={<FaUsers />} label="Students Enrolled" value={data?.totalStudents ?? 0} color="text-emerald-500" />
        <StatCard icon={<FaMoneyBillWave />} label="Total Revenue" value={`$${data?.totalRevenue ?? 0}`} color="text-primary" />
        <StatCard icon={<FaHandHoldingUsd />} label="My Earnings (80%)" value={`$${data?.totalEarnings ?? 0}`} color="text-amber-500" />
      </div>

      {/* Monthly Earnings Chart */}
      <div className="customGradiant2 px-5 boxCss py-10">
        <h2 className="text-2xl font-semibold mb-8 flex items-center justify-center gap-2">
          <FaChalkboardTeacher className="text-primary" />
          Monthly Earnings
        </h2>
        {monthlyEarnings.length === 0 ? (
          <p className="text-center text-base-content/50 py-10">
            No payment data yet. Your earnings will appear here after your first enrolment.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `$${v}`} />
              <Legend />
              <Bar dataKey="earnings" name="My Earnings ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="enrollments" name="Enrollments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionContainer>
  );
};

export default TutorOverview;
