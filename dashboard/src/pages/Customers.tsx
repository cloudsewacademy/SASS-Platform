import SimpleCrudPage from "../components/SimpleCrudPage";

interface Customer { _id: string; name: string; phone: string; email?: string; totalOrders: number; totalSpent: number; createdAt: string }

export default function Customers() {
  return (
    <SimpleCrudPage<Customer>
      resource="customers"
      title="Customers"
      emptyLabel="No customers yet — they'll appear automatically once orders come in."
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", required: true },
        { name: "email", label: "Email", type: "email" },
      ]}
      columns={[
        { header: "Name", render: (c) => c.name },
        { header: "Phone", render: (c) => c.phone },
        { header: "Orders", render: (c) => c.totalOrders },
        { header: "Total spent", render: (c) => `NPR ${c.totalSpent.toLocaleString()}` },
      ]}
    />
  );
}
