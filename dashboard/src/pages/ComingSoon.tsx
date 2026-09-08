import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      <div className="empty-state">
        <Construction size={32} strokeWidth={1.5} />
        <p>{title} isn't built yet — this is next on the roadmap.</p>
      </div>
    </div>
  );
}
