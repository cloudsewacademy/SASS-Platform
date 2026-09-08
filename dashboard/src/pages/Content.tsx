import { useState } from "react";
import SimpleCrudPage from "../components/SimpleCrudPage";
import PagesManager from "./PagesManager";

interface BlogPost { _id: string; title: string; slug: string; status: string; createdAt: string }

export default function Content() {
  const [tab, setTab] = useState<"pages" | "blog">("pages");

  return (
    <div>
      <div className="tab-row" style={{ padding: "32px 32px 0" }}>
        <button className={tab === "pages" ? "tab active" : "tab"} onClick={() => setTab("pages")}>Pages</button>
        <button className={tab === "blog" ? "tab active" : "tab"} onClick={() => setTab("blog")}>Blog</button>
      </div>

      {tab === "pages" ? (
        <PagesManager />
      ) : (
        <SimpleCrudPage<BlogPost>
          resource="blog"
          title="Blog Posts"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "content", label: "Content", type: "textarea" },
            { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
          ]}
          columns={[
            { header: "Title", render: (p) => p.title },
            { header: "Slug", render: (p) => p.slug },
            { header: "Status", render: (p) => p.status },
          ]}
        />
      )}
    </div>
  );
}
