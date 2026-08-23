import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FileText,
  Users,
  Search,
  Plus,
  Eye,
} from "lucide-react";

import api from "../services/api";

interface Customer {
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
  customer: Customer;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ==============================
  // GET INVOICES
  // ==============================

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await api.get("/invoices");

      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ==============================
  // SEARCH
  // ==============================

  const filteredInvoices = invoices.filter((invoice) => {
    const text = search.toLowerCase();

    return (
      invoice.invoiceNumber
        .toLowerCase()
        .includes(text) ||
      invoice.customer?.name
        ?.toLowerCase()
        .includes(text) ||
      invoice.status
        .toLowerCase()
        .includes(text)
    );
  });

  // ==============================
  // FORMAT MONEY
  // ==============================

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ==============================
          SIDEBAR
      ============================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 md:block">

        <div className="flex h-16 items-center border-b border-slate-800 px-6">

          <h1 className="text-xl font-bold">
            SaaS
            <span className="text-indigo-400">
              Invoice
            </span>
          </h1>

        </div>

        <nav className="p-4">

          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
            className="mt-2 flex items-center gap-3 rounded-lg bg-indigo-500/10 px-4 py-3 text-indigo-400"
          >
            <FileText size={19} />
            Invoices
          </a>

        </nav>

      </aside>

      {/* ==============================
          MAIN
      ============================== */}

      <main className="md:ml-64">

        {/* TOPBAR */}

        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-6">

          <p className="text-sm text-slate-400">
            Invoices
          </p>

        </header>

        {/* CONTENT */}

        <div className="p-6">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-2xl font-bold">
                Invoices
              </h2>

              <p className="mt-1 text-slate-400">
                Create and manage your invoices.
              </p>

            </div>

            <button
  onClick={() => navigate("/invoices/create")}
  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 font-medium transition hover:bg-indigo-600"
>
              <Plus size={18} />
              Create Invoice
            </button>

          </div>

          {/* SEARCH */}

          <div className="mb-6">

            <div className="relative max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

            </div>

          </div>

          {/* ==============================
              INVOICE TABLE
          ============================== */}

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

            {/* LOADING */}

            {loading && (

              <div className="p-10 text-center text-slate-500">
                Loading invoices...
              </div>

            )}

            {/* EMPTY */}

            {!loading &&
              filteredInvoices.length === 0 && (

                <div className="flex min-h-64 items-center justify-center p-6">

                  <div className="text-center">

                    <FileText
                      size={40}
                      className="mx-auto mb-3 text-slate-700"
                    />

                    <p className="text-slate-400">

                      {search
                        ? "No invoices found."
                        : "No invoices yet."}

                    </p>

                    {!search && (

                      <p className="mt-1 text-sm text-slate-600">
                        Create your first invoice to get started.
                      </p>

                    )}

                  </div>

                </div>

              )}

            {/* TABLE */}

            {!loading &&
              filteredInvoices.length > 0 && (

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
                          Issue Date
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Due Date
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Amount
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right font-medium">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredInvoices.map(
                        (invoice) => (

                          <tr
                            key={invoice.id}
                            className="border-b border-slate-800 last:border-0 transition hover:bg-slate-800/40"
                          >

                            {/* INVOICE */}

                            <td className="px-5 py-5">

                              <p className="font-medium">
                                {invoice.invoiceNumber}
                              </p>

                            </td>

                            {/* CUSTOMER */}

                            <td className="px-5 py-5 text-sm text-slate-400">

                              {invoice.customer?.name ||
                                "Unknown"}

                            </td>

                            {/* ISSUE DATE */}

                            <td className="px-5 py-5 text-sm text-slate-400">

                              {new Date(
                                invoice.issueDate
                              ).toLocaleDateString(
                                "en-IN"
                              )}

                            </td>

                            {/* DUE DATE */}

                            <td className="px-5 py-5 text-sm text-slate-400">

                              {new Date(
                                invoice.dueDate
                              ).toLocaleDateString(
                                "en-IN"
                              )}

                            </td>

                            {/* AMOUNT */}

                            <td className="px-5 py-5 font-medium">

                              {formatMoney(
                                invoice.total
                              )}

                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-5">

                              <StatusBadge
                                status={
                                  invoice.status
                                }
                              />

                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-5">

                              <div className="flex justify-end">

                                <button
  title="View invoice"
  onClick={() =>
    navigate(`/invoices/${invoice.id}`)
  }
  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
>
  <Eye size={18} />
</button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

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

// ==============================
// STATUS BADGE
// ==============================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    DRAFT:
      "bg-slate-700/40 text-slate-300",

    SENT:
      "bg-blue-500/10 text-blue-400",

    PAID:
      "bg-emerald-500/10 text-emerald-400",

    OVERDUE:
      "bg-red-500/10 text-red-400",

    CANCELLED:
      "bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-700/40 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}