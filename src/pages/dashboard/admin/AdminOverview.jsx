import React, { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaUsersCog,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserShield,
  FaChartPie,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaChartBar,
  FaBookOpen,
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import SectionContainer from "../../../components/SectionContainer/SectionContainer";
import { AuthContext } from "../../../main";
import Loading from "../../Others/Loading";
import useFetchApi from "../../../Api/useFetchApi";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

const StatCard = ({ icon, label, value, color }) => (
  <div className={`customGradiant2 border-2 border-primary rounded-xl shadow-primary p-6 flex items-center gap-5 hover:shadow-sm transition duration-300`}>
    <span className={`text-4xl ${color || "text-primary"}`}>{icon}</span>
    <div>
      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide">{label}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  </div>
);

const AdminOverview = () => {
  const { user } = useContext(AuthContext);
  const { getAdminStats, getAllUsers } = useFetchApi();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats", user?.email],
    queryFn: () => getAdminStats(user?.email),
    enabled: !!user?.email,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["allUsersOverview", user?.email],
    queryFn: () => getAllUsers("", 1, 1000, user?.email),
    enabled: !!user?.email,
  });

  if (statsLoading || usersLoading) return <Loading />;

  const users = usersData?.users || [];
  const totalStudents = users.filter((u) => u.userRole === "Student").length;
  const totalTutors = users.filter((u) => u.userRole === "Tutor").length;
  const totalAdmins = users.filter((u) => u.userRole === "Admin").length;
  const totalUsers = users.length;

  const userDistribution = [
    { name: "Students", value: totalStudents },
    { name: "Tutors", value: totalTutors },
    { name: "Admins", value: totalAdmins },
  ];

  const monthlyRevenue = stats?.monthlyRevenue || [];

  return (
    <SectionContainer className="customGradiant3 min-h-screen">
      <h1 className="text-3xl lg:text-5xl font-bold text-center mb-8">
        Welcome Admin,{" "}
        <span className="text-primary">{user?.displayName || "Admin"}</span>
      </h1>

      {/* ── User Stats ── */}
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FaUsersCog className="text-primary" /> User Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<FaUsersCog />} label="Total Users" value={totalUsers} color="text-primary" />
        <StatCard icon={<FaUserGraduate />} label="Students" value={totalStudents} color="text-blue-500" />
        <StatCard icon={<FaChalkboardTeacher />} label="Tutors" value={totalTutors} color="text-amber-500" />
        <StatCard icon={<FaUserShield />} label="Admins" value={totalAdmins} color="text-emerald-500" />
      </div>

      {/* ── Financial Overview ── */}
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FaMoneyBillWave className="text-primary" /> Financial Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<FaMoneyBillWave />} label="Total Platform Revenue" value={`$${stats?.totalRevenue ?? 0}`} color="text-primary" />
        <StatCard icon={<FaHandHoldingUsd />} label="Admin Earnings (20%)" value={`$${stats?.totalAdminEarnings ?? 0}`} color="text-emerald-500" />
        <StatCard icon={<FaChalkboardTeacher />} label="Teacher Payouts (80%)" value={`$${stats?.totalTutorPayouts ?? 0}`} color="text-amber-500" />
        <StatCard icon={<FaBookOpen />} label="Total Enrollments" value={stats?.totalEnrollments ?? 0} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* User Distribution Pie */}
        <div className="customGradiant2 rounded-2xl px-6 py-10 border-2 border-primary shadow-primary hover:shadow-sm transition duration-300">
          <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2 text-primary">
            <FaChartPie /> User Role Distribution
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={userDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {userDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Bar */}
        <div className="customGradiant2 rounded-2xl px-6 py-10 border-2 border-primary shadow-primary hover:shadow-sm transition duration-300">
          <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2 text-primary">
            <FaChartBar /> Monthly Revenue
          </h2>
          {monthlyRevenue.length === 0 ? (
            <p className="text-center text-base-content/50 mt-16">No payment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v) => `$${v}`} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrollments" name="Enrollments" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </SectionContainer>
  );
};

export default AdminOverview;
