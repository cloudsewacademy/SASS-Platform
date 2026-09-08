import SimpleCrudPage from "../components/SimpleCrudPage";

interface Lead { _id: string; name: string; phone: string; email?: string; source: string; status: string; createdAt: string }

export default function Leads() {
  return (
    <SimpleCrudPage<Lead>
      resource="leads"
      title="Leads"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "source", label: "Source" },
      ]}
      columns={[
        { header: "Name", render: (l) => l.name },
        { header: "Phone", render: (l) => l.phone },
        { header: "Source", render: (l) => l.source },
        { header: "Status", render: (l) => <span className="badge">{l.status}</span> },
      ]}
    />
  );
}
