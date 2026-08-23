import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  X,
} from "lucide-react";

import api from "../services/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // NEW: tracks whether we are editing
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // ==============================
  // GET CUSTOMERS
  // ==============================

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/customers");

      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ==============================
  // OPEN ADD MODAL
  // ==============================

  const openAddModal = () => {
    setEditingCustomer(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setShowModal(true);
  };

  // ==============================
  // OPEN EDIT MODAL
  // ==============================

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || "",
    });

    setShowModal(true);
  };

  // ==============================
  // SAVE CUSTOMER
  // ==============================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone) {
      alert("Name, email and phone are required.");
      return;
    }

    try {
      setSaving(true);

      // EDIT
      if (editingCustomer) {
        await api.put(
          `/customers/${editingCustomer.id}`,
          form
        );

        alert("Customer updated successfully!");
      }

      // ADD
      else {
        await api.post("/customers", form);

        alert("Customer added successfully!");
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
      });

      setEditingCustomer(null);
      setShowModal(false);

      await fetchCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);

      alert("Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };
  
  // ==============================
  // DELETE CUSTOMER
  // ==============================


  const handleDeleteCustomer = async (id: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this customer?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/customers/${id}`);

    alert("Customer deleted successfully!");

    await fetchCustomers();
  } catch (error) {
    console.error("Failed to delete customer:", error);

    alert("Failed to delete customer.");
  }
};


  // ==============================
  // SEARCH
  // ==============================

  const filteredCustomers = customers.filter((customer) => {
    const text = search.toLowerCase();

    return (
      customer.name.toLowerCase().includes(text) ||
      customer.email.toLowerCase().includes(text) ||
      customer.phone.toLowerCase().includes(text)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 md:block">

        <div className="flex h-16 items-center border-b border-slate-800 px-6">

          <h1 className="text-xl font-bold">
            SaaS<span className="text-indigo-400">
              Invoice
            </span>
          </h1>

        </div>

        <nav className="p-4">

          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Dashboard
          </a>

          <a
            href="/customers"
            className="mt-2 flex items-center gap-3 rounded-lg bg-indigo-500/10 px-4 py-3 text-indigo-400"
          >
            <Users size={19} />
            Customers
          </a>

          <a
            href="/invoices"
            className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Invoices
          </a>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="md:ml-64">

        {/* TOPBAR */}

        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-6">

          <p className="text-sm text-slate-400">
            Customers
          </p>

        </header>

        {/* CONTENT */}

        <div className="p-6">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-2xl font-bold">
                Customers
              </h2>

              <p className="mt-1 text-slate-400">
                Manage your business customers.
              </p>

            </div>

            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 font-medium transition hover:bg-indigo-600"
            >
              <Plus size={18} />
              Add Customer
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
                placeholder="Search customers..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

            {loading && (
              <div className="p-10 text-center text-slate-500">
                Loading customers...
              </div>
            )}

            {!loading &&
              filteredCustomers.length === 0 && (
                <div className="flex min-h-64 items-center justify-center p-6">

                  <div className="text-center">

                    <Users
                      size={40}
                      className="mx-auto mb-3 text-slate-700"
                    />

                    <p className="text-slate-400">
                      {search
                        ? "No customers found."
                        : "No customers yet."}
                    </p>

                  </div>

                </div>
              )}

            {!loading &&
              filteredCustomers.length > 0 && (

                <div className="overflow-x-auto">

                  <table className="w-full text-left">

                    <thead className="border-b border-slate-800 bg-slate-950/40">

                      <tr className="text-xs uppercase tracking-wider text-slate-500">

                        <th className="px-5 py-4 font-medium">
                          Customer
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Contact
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Address
                        </th>

                        <th className="px-5 py-4 text-right font-medium">
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredCustomers.map(
                        (customer) => (

                          <tr
                            key={customer.id}
                            className="border-b border-slate-800 last:border-0 transition hover:bg-slate-800/40"
                          >

                            {/* CUSTOMER */}

                            <td className="px-5 py-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 font-semibold text-indigo-400">

                                  {customer.name
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>

                                <div>

                                  <p className="font-medium">
                                    {customer.name}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">

                                    Added{" "}

                                    {new Date(
                                      customer.createdAt
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )}

                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CONTACT */}

                            <td className="px-5 py-5">

                              <div className="space-y-1 text-sm">

                                <p className="flex items-center gap-2 text-slate-400">

                                  <Mail size={14} />

                                  {customer.email}

                                </p>

                                <p className="flex items-center gap-2 text-slate-500">

                                  <Phone size={14} />

                                  {customer.phone}

                                </p>

                              </div>

                            </td>

                            {/* ADDRESS */}

                            <td className="px-5 py-5">

                              <p className="flex max-w-xs items-start gap-2 text-sm text-slate-400">

                                <MapPin
                                  size={14}
                                  className="mt-0.5 shrink-0"
                                />

                                <span>
                                  {customer.address ||
                                    "No address"}
                                </span>

                              </p>

                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-5">

                              <div className="flex justify-end gap-2">

                                <button
                                  title="Edit customer"
                                  onClick={() =>
                                    openEditModal(
                                      customer
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                >
                                  <Pencil size={17} />
                                </button>

                                <button
  title="Delete customer"
  onClick={() => handleDeleteCustomer(customer.id)}
  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
>
  <Trash2 size={17} />
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

      {/* ==============================
          ADD / EDIT MODAL
      ============================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            {/* HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-semibold">

                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}

                </h3>

                <p className="mt-1 text-sm text-slate-500">

                  {editingCustomer
                    ? "Update customer information."
                    : "Add a new customer to your business."}

                </p>

              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <input
                type="text"
                placeholder="Customer name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <textarea
                placeholder="Address"
                rows={3}
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
                className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-medium hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                    ? "Update Customer"
                    : "Add Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}