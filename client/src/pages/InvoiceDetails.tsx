import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../services/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;

  // IMPORTANT:
  // Backend stores this as "amount"
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;

  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  status: string;

  customer: Customer;

  items: InvoiceItem[];
}

export default function InvoiceDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // FETCH INVOICE
  // ==========================================

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(
          `/invoices/${id}`
        );

        setInvoice(
          response.data.invoice
        );
      } catch (error) {
        console.error(
          "Failed to fetch invoice:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(Number(amount) || 0);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading invoice...
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">

          <p className="mb-4 text-slate-400">
            Invoice not found.
          </p>

          <button
            onClick={() =>
              navigate("/invoices")
            }
            className="rounded-lg bg-indigo-500 px-5 py-3 font-medium hover:bg-indigo-600"
          >
            Back to Invoices
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ==========================================
          TOP BAR
      ========================================== */}

      <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900 px-6">

        <button
          onClick={() =>
            navigate("/invoices")
          }
          className="mr-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3">

          <FileText
            size={20}
            className="text-indigo-400"
          />

          <h1 className="text-lg font-semibold">
            Invoice Details
          </h1>

        </div>

      </header>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <main className="mx-auto max-w-5xl p-6">

        {/* ==========================================
            INVOICE HEADER
        ========================================== */}

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col justify-between gap-6 md:flex-row">

            <div>

              <p className="text-sm text-slate-500">
                Invoice
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {invoice.invoiceNumber}
              </h2>

              <span className="mt-3 inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                {invoice.status}
              </span>

            </div>

            <div className="text-left md:text-right">

              <p className="text-sm text-slate-500">
                Issue Date
              </p>

              <p className="mt-1 text-slate-300">
                {new Date(
                  invoice.issueDate
                ).toLocaleDateString(
                  "en-IN"
                )}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Due Date
              </p>

              <p className="mt-1 text-slate-300">
                {invoice.dueDate
                  ? new Date(
                      invoice.dueDate
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : "Not specified"}
              </p>

            </div>

          </div>

        </div>

        {/* ==========================================
            CUSTOMER
        ========================================== */}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Bill To
          </h3>

          <h4 className="text-lg font-semibold">
            {invoice.customer?.name}
          </h4>

          <p className="mt-1 text-slate-400">
            {invoice.customer?.email}
          </p>

          {invoice.customer?.phone && (
            <p className="mt-1 text-slate-500">
              {invoice.customer.phone}
            </p>
          )}

          {invoice.customer?.address && (
            <p className="mt-1 text-slate-500">
              {invoice.customer.address}
            </p>
          )}

        </div>

        {/* ==========================================
            ITEMS
        ========================================== */}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-slate-800 bg-slate-950/40">

                <tr className="text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4">
                    Description
                  </th>

                  <th className="px-6 py-4">
                    Quantity
                  </th>

                  <th className="px-6 py-4">
                    Unit Price
                  </th>

                  <th className="px-6 py-4 text-right">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                {invoice.items?.map(
                  (item) => (

                    <tr
                      key={item.id}
                      className="border-b border-slate-800 last:border-0"
                    >

                      <td className="px-6 py-5 font-medium">
                        {item.description}
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {item.quantity}
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {formatMoney(
                          item.unitPrice
                        )}
                      </td>

                      <td className="px-6 py-5 text-right font-medium">
                        {formatMoney(
                          item.amount
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ==========================================
            TOTALS
        ========================================== */}

        <div className="mt-6 flex justify-end">

          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="space-y-4">

              {/* SUBTOTAL */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Subtotal
                </span>

                <span>
                  {formatMoney(
                    invoice.subtotal
                  )}
                </span>

              </div>

              {/* TAX */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Tax
                </span>

                <span className="text-emerald-400">
                  +{formatMoney(
                    invoice.tax
                  )}
                </span>

              </div>

              {/* DISCOUNT */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Discount
                </span>

                <span className="text-red-400">
                  -{formatMoney(
                    invoice.discount
                  )}
                </span>

              </div>

              {/* GRAND TOTAL */}

              <div className="border-t border-slate-800 pt-4">

                <div className="flex justify-between">

                  <span className="text-lg font-semibold">
                    Grand Total
                  </span>

                  <span className="text-2xl font-bold text-indigo-400">
                    {formatMoney(
                      invoice.total
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}