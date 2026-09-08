import SimpleCrudPage from "../components/SimpleCrudPage";

interface Category { _id: string; name: string; slug: string; image?: string; description?: string; hideOnProductPages?: boolean; createdAt: string }

export default function Categories() {
  return (
    <SimpleCrudPage<Category>
      resource="categories"
      title="Categories"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "image", label: "Category image", type: "image" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "seoTitle", label: "SEO title (40-60 chars)" },
        { name: "seoDescription", label: "SEO description (140-160 chars)", type: "textarea" },
        { name: "hideOnProductPages", label: "Hide on product pages", type: "checkbox" },
      ]}
      columns={[
        { header: "Name", render: (c) => c.name },
        { header: "Slug", render: (c) => c.slug },
        { header: "Created", render: (c) => new Date(c.createdAt).toLocaleDateString() },
      ]}
    />
  );
}
