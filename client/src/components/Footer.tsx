import { Link } from "wouter";
import Brand from "./Brand";
import { useEditorialCopy } from "@/lib/editorial";

export default function Footer() {
  const c = useEditorialCopy();
  return (
    <footer className="site-footer">
      <div className="site-width">
        <div className="footer-top">
          <div>
            <Brand />
            <p>{c("Good work, well presented.", "好工程，好呈现。")}</p>
          </div>
          <nav aria-label={c("Footer navigation", "页脚导航")}>
            <Link href="/pricing">{c("Pricing", "价格")}</Link>
            <Link href="/terms">{c("Terms", "服务条款")}</Link>
            <Link href="/privacy">{c("Privacy", "隐私政策")}</Link>
            <Link href="/refund">{c("Refunds", "退款政策")}</Link>
            <a href="mailto:hello@proposai.org">{c("Contact", "联系我们")}</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ProposAI</span>
          <span>
            {c(
              "The proposal workspace for the trades.",
              "面向工程行业的提案工作空间。"
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
