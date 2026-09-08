import SimpleCrudPage from "../components/SimpleCrudPage";

interface Issue { _id: string; subject: string; description: string; priority: string; status: string; createdAt: string }

export default function Issues() {
  return (
    <SimpleCrudPage<Issue>
      resource="issues"
      title="Issues"
      fields={[
        { name: "subject", label: "Subject", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
      ]}
      columns={[
        { header: "Subject", render: (i) => i.subject },
        { header: "Priority", render: (i) => <span className="badge">{i.priority}</span> },
        { header: "Status", render: (i) => <span className="badge">{i.status}</span> },
        { header: "Created", render: (i) => new Date(i.createdAt).toLocaleDateString() },
      ]}
    />
  );
}
