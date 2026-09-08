import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import StoreLayout from "../components/StoreLayout";
import { useStoreSlug } from "../context/ResolvedSlugContext";

interface Page {
  title: string;
  content: string;
}

export default function CmsPage() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const slug = useStoreSlug();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug || !pageSlug) return;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/public/stores/${slug}/pages/${pageSlug}`)
      .then(({ data }) => setPage(data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, pageSlug]);

  return (
    <StoreLayout>
      {() =>
        loading ? (
          <p>Loading...</p>
        ) : notFound || !page ? (
          <div className="empty-state-store">
            <p>This page doesn't exist.</p>
          </div>
        ) : (
          <article className="cms-page">
            <h1>{page.title}</h1>
            {page.content.split("\n").map((para, i) => (para.trim() ? <p key={i}>{para}</p> : <br key={i} />))}
          </article>
        )
      }
    </StoreLayout>
  );
}
