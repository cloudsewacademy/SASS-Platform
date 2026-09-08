import SimpleCrudPage from "../components/SimpleCrudPage";

interface Brand { _id: string; name: string; slug: string; logo?: string; skuPrefix?: string; countryOrigin?: string; status?: string; popular?: boolean; featured?: boolean; createdAt: string }

export default function Brands() {
  return (
    <SimpleCrudPage<Brand>
      resource="brands"
      title="Brands"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "logo", label: "Logo", type: "image" },
        { name: "skuPrefix", label: "SKU prefix (e.g. FENTY)" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "countryOrigin", label: "Country / origin" },
        { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
        { name: "popular", label: "Mark popular", type: "checkbox" },
        { name: "featured", label: "Mark featured", type: "checkbox" },
      ]}
      columns={[
        { header: "Name", render: (b) => b.name },
        { header: "Slug", render: (b) => b.slug },
        { header: "SKU prefix", render: (b) => b.skuPrefix || "—" },
        { header: "Status", render: (b) => b.status || "active" },
        { header: "Created", render: (b) => new Date(b.createdAt).toLocaleDateString() },
      ]}
    />
  );
}
