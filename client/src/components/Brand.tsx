import { Link } from "wouter";

export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="ProposAI home"
    >
      <span className="brand-mark" aria-hidden="true">
        P<span>.</span>
      </span>
      <span>ProposAI</span>
    </Link>
  );
}
