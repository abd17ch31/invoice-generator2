import { useEffect, useState } from "react";
import {
  FileText,
  Users,
  IndianRupee,
  Plus,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";








interface DashboardStats {
  customers: number;
  invoices: number;
  revenue: number;
}

interface Customer {
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  issueDate: string;
  customer: Customer;
}

export default function Dashboard() {
const { user, logout } = useAuth();

// just to check
const navigate = useNavigate();    

  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    invoices: 0,
    revenue: 0,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, invoicesResponse] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/recent-invoices"),
        ]);

        setStats(statsResponse.data.stats);
        setInvoices(invoicesResponse.data.invoices);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formattedRevenue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(stats.revenue);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 md:block">

        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <h1 className="text-xl font-bold">
            SaaS<span className="text-indigo-400">Invoice</span>
          </h1>
        </div>

        <nav className="p-4">

          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg bg-indigo-500/10 px-4 py-3 text-indigo-400"
          >
            <FileText size={19} />
            Dashboard
          </a>

          <a
            href="/customers"
            className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Customers
          </a>

          <a
            href="/invoices"
            className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <FileText size={19} />
            Invoices
          </a>

        </nav>
      </aside>

      {/* Main */}
      <main className="md:ml-64">

        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6">

          <p className="text-sm text-slate-400">
            Dashboard
          </p>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-medium">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-500">
                {user?.email}
              </p>

            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>


          {/* LOGOUT */}
  <button
  onClick={() => {
    logout();
    navigate("/login");
  }}
  className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
>
  <LogOut size={17} />
  <span className="hidden sm:inline">
    Logout
  </span>
</button>


          </div>

        </header>

        {/* Dashboard */}
        <div className="p-6">

          {/* Welcome */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-2xl font-bold">
                Good to see you,{" "}
                {user?.name?.split(" ")[0] || "there"} 👋
              </h2>

              <p className="mt-1 text-slate-400">
                Here's what's happening with your business.
              </p>

            </div>

            <button className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 font-medium transition hover:bg-indigo-600">
              <Plus size={18} />
              Create Invoice
            </button>

          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatCard
              title="Total Revenue"
              value={loading ? "Loading..." : formattedRevenue}
              icon={<IndianRupee size={20} />}
            />

            <StatCard
              title="Total Invoices"
              value={loading ? "..." : stats.invoices.toString()}
              icon={<FileText size={20} />}
            />

            <StatCard
              title="Customers"
              value={loading ? "..." : stats.customers.toString()}
              icon={<Users size={20} />}
            />

          </div>

          {/* Recent Invoices */}
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5">

              <div>

                <h3 className="font-semibold">
                  Recent Invoices
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest invoices.
                </p>

              </div>

              <a
                href="/invoices"
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
              >
                View all
                <ArrowUpRight size={15} />
              </a>

            </div>

            {/* Loading */}
            {loading && (
              <div className="p-10 text-center text-slate-500">
                Loading invoices...
              </div>
            )}

            {/* Empty */}
            {!loading && invoices.length === 0 && (
              <div className="flex min-h-48 items-center justify-center p-6">

                <div className="text-center">

                  <FileText
                    size={36}
                    className="mx-auto mb-3 text-slate-700"
                  />

                  <p className="text-slate-400">
                    No invoices yet.
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Create your first invoice to see it here.
                  </p>

                </div>

              </div>
            )}

            {/* Invoice table */}
            {!loading && invoices.length > 0 && (
              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="border-b border-slate-800 bg-slate-950/40">

                    <tr className="text-xs uppercase tracking-wider text-slate-500">

                      <th className="px-5 py-4 font-medium">
                        Invoice
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Customer
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Date
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {invoices.map((invoice) => (

                      <tr
                        key={invoice.id}
                        className="border-b border-slate-800 last:border-0 transition hover:bg-slate-800/40"
                      >

                        <td className="px-5 py-4">

                          <p className="font-medium">
                            {invoice.invoiceNumber}
                          </p>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {invoice.customer?.name || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {new Date(invoice.issueDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(invoice.total)}
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge status={invoice.status} />

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

/* -------------------------------- */
/* Stat Card */
/* -------------------------------- */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <div className="mb-4 flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {title}
        </p>

        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
          {icon}
        </div>

      </div>

      <p className="text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* -------------------------------- */
/* Status Badge */
/* -------------------------------- */

function StatusBadge({ status }: { status: string }) {

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-slate-700/40 text-slate-300",
    SENT: "bg-blue-500/10 text-blue-400",
    PAID: "bg-emerald-500/10 text-emerald-400",
    OVERDUE: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        statusStyles[status] ||
        "bg-slate-700/40 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}