import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${Date.now()}`
  );

  const [customerId, setCustomerId] = useState("");

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState("");

  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  // ==============================
  // GET CUSTOMERS
  // ==============================

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");

        setCustomers(response.data.customers || []);
      } catch (error) {
        console.error(
          "Failed to fetch customers:",
          error
        );
      }
    };

    fetchCustomers();
  }, []);

  // ==============================
  // ITEM FUNCTIONS
  // ==============================

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      return;
    }

    setItems(
      items.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setItems(updatedItems);
  };

  // ==============================
  // CALCULATIONS
  // ==============================

  // Original amount
  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  // Example:
  // ₹400 × 18% = ₹72
  const taxAmount =
    subtotal * (tax / 100);

  // Example:
  // ₹400 + ₹72 = ₹472
  const amountAfterTax =
    subtotal + taxAmount;

  // Example:
  // ₹472 × 10% = ₹47.20
  const discountAmount =
    amountAfterTax * (discount / 100);

  // Example:
  // ₹472 - ₹47.20 = ₹424.80
  const total =
    amountAfterTax - discountAmount;

  // ==============================
  // MONEY FORMAT
  // ==============================

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ==============================
  // SAVE INVOICE
  // ==============================

  const handleSaveInvoice = async () => {
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (!dueDate) {
      alert("Please select a due date.");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.description.trim() ||
          item.quantity <= 0 ||
          item.unitPrice < 0
      )
    ) {
      alert("Please complete all invoice items.");
      return;
    }

    try {
      setSaving(true);

      const invoiceData = {
        invoiceNumber,
        customerId,
        issueDate,
        dueDate,

        // Percentage values
        tax,
        discount,

        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      console.log(
        "Sending invoice:",
        invoiceData
      );

      await api.post(
        "/invoices",
        invoiceData
      );

      alert(
        "Invoice created successfully!"
      );

      navigate("/invoices");
    } catch (error: any) {
      console.error(
        "Failed to create invoice:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to create invoice."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ==============================
          TOPBAR
      ============================== */}

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
            Create Invoice
          </h1>

        </div>

      </header>

      {/* ==============================
          MAIN CONTENT
      ============================== */}

      <main className="mx-auto max-w-6xl p-6">

        {/* ==============================
            INVOICE INFORMATION
        ============================== */}

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="mb-6 text-lg font-semibold">
            Invoice Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            {/* INVOICE NUMBER */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Invoice Number
              </label>

              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) =>
                  setInvoiceNumber(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

            {/* CUSTOMER */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(e) =>
                  setCustomerId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              >

                <option value="">
                  Select customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* ISSUE DATE */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Issue Date
              </label>

              <input
                type="date"
                value={issueDate}
                onChange={(e) =>
                  setIssueDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

            {/* DUE DATE */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

          </div>

        </div>

        {/* ==============================
            INVOICE ITEMS
        ============================== */}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold">
                Invoice Items
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add the products or services.
              </p>

            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-600"
            >
              <Plus size={17} />
              Add Item
            </button>

          </div>

          <div className="space-y-4">

            {items.map(
              (item, index) => (

                <div
                  key={index}
                  className="grid gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4 md:grid-cols-[1fr_120px_160px_120px_45px]"
                >

                  {/* DESCRIPTION */}

                  <div>

                    <label className="mb-2 block text-xs text-slate-500 md:hidden">
                      Description
                    </label>

                    <input
                      type="text"
                      placeholder="Description"
                      value={
                        item.description
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
                    />

                  </div>

                  {/* QUANTITY */}

                  <div>

                    <label className="mb-2 block text-xs text-slate-500 md:hidden">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
                    />

                  </div>

                  {/* UNIT PRICE */}

                  <div>

                    <label className="mb-2 block text-xs text-slate-500 md:hidden">
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        item.unitPrice
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
                    />

                  </div>

                  {/* ITEM TOTAL */}

                  <div className="flex items-center">

                    <div>

                      <p className="text-xs text-slate-500 md:hidden">
                        Total
                      </p>

                      <p className="font-medium">
                        {formatMoney(
                          item.quantity *
                            item.unitPrice
                        )}
                      </p>

                    </div>

                  </div>

                  {/* DELETE */}

                  <div className="flex items-center justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          index
                        )
                      }
                      disabled={
                        items.length === 1
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

        {/* ==============================
            TAX / DISCOUNT + SUMMARY
        ============================== */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {/* TAX & DISCOUNT */}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="mb-6 text-lg font-semibold">
              Tax & Discount
            </h2>

            <div className="space-y-5">

              {/* TAX */}

              <div>

                <label className="mb-2 block text-sm text-slate-400">
                  Tax (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) =>
                    setTax(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Tax is added to the original
                  subtotal.
                </p>

              </div>

              {/* DISCOUNT */}

              <div>

                <label className="mb-2 block text-sm text-slate-400">
                  Discount (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Discount is calculated on
                  the amount after tax.
                </p>

              </div>

            </div>

          </div>

          {/* ==============================
              SUMMARY
          ============================== */}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="mb-6 text-lg font-semibold">
              Invoice Summary
            </h2>

            <div className="space-y-4">

              {/* SUBTOTAL */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Original Amount
                </span>

                <span>
                  {formatMoney(
                    subtotal
                  )}
                </span>

              </div>

              {/* TAX */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Add {tax}% Tax
                </span>

                <span className="text-emerald-400">
                  +{formatMoney(
                    taxAmount
                  )}
                </span>

              </div>

              {/* AMOUNT AFTER TAX */}

              <div className="flex justify-between border-t border-slate-800 pt-4 text-slate-300">

                <span>
                  Amount After Tax
                </span>

                <span>
                  {formatMoney(
                    amountAfterTax
                  )}
                </span>

              </div>

              {/* DISCOUNT */}

              <div className="flex justify-between text-slate-400">

                <span>
                  Subtract {discount}% Discount
                </span>

                <span className="text-red-400">
                  -{formatMoney(
                    discountAmount
                  )}
                </span>

              </div>

              {/* TOTAL */}

              <div className="border-t border-slate-800 pt-4">

                <div className="flex items-center justify-between">

                  <span className="text-lg font-semibold">
                    Final Total
                  </span>

                  <span className="text-2xl font-bold text-indigo-400">
                    {formatMoney(total)}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==============================
            ACTION BUTTONS
        ============================== */}

        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/invoices")
            }
            className="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleSaveInvoice
            }
            disabled={saving}
            className="rounded-lg bg-indigo-500 px-6 py-3 font-medium hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Invoice"}
          </button>

        </div>

      </main>

    </div>
  );
}