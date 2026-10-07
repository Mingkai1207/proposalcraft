import { Link } from "wouter";
import { Check, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEditorialCopy } from "@/lib/editorial";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export default function Pricing() {
  const c = useEditorialCopy();
  const { isAuthenticated } = useAuth();
  const plans = [
    {
      name: c("Starter", "入门"),
      note: c(
        "The essentials for a clear proposal.",
        "清晰提案所需的基本功能。"
      ),
      features: [
        c("Unlimited proposals during launch", "上线期间提案数量不限"),
        c("Guided proposal drafting", "引导式提案撰写"),
        c("Business profile auto-fill", "自动填入业务信息"),
        c("Summary review before generation", "生成前审阅摘要"),
        c("PDF export", "PDF 导出"),
        c("Save and upload templates", "保存并上传模板"),
      ],
    },
    {
      name: c("Professional", "专业"),
      note: c("Your documents, in your own style.", "以自己的风格呈现文档。"),
      features: [
        c("Everything in Starter", "包含入门方案全部功能"),
        c("Word and Google Doc exports", "Word 和 Google Doc 导出"),
        c("Proposal revisions", "提案修改"),
        c("Your logo and business branding", "自己的标志与品牌信息"),
        c("Custom terms and conditions", "自定义条款"),
        c("Multi-language proposals", "多语言提案"),
        c("Template-based generation", "基于模板生成"),
      ],
    },
    {
      name: c("Business", "商业"),
      note: c("A wider view of the work ahead.", "全面了解接下来的工作。"),
      features: [
        c("Everything in Professional", "包含专业方案全部功能"),
        c("Bulk proposal exports as ZIP", "批量导出提案为 ZIP"),
        c("Win rate and revenue analytics", "成交率与营收分析"),
        c("Priority support", "优先支持"),
      ],
    },
  ];
  return (
    <div className="editorial-site">
      <SiteHeader />
      <main className="site-width">
        <div className="pricing-intro">
          <span className="eyebrow">{c("PLANS & PRICING", "方案与价格")}</span>
          <h1>
            {c("Make room for", "为好工程")}
            <br />
            <em>{c("good work.", "留出更多空间。")}</em>
          </h1>
          <p>
            {c(
              "A proposal workspace that grows with your business. During our launch, explore every plan at no cost.",
              "随业务一起成长的提案工作空间。上线期间，可免费体验每个方案。"
            )}
          </p>
        </div>
        <div className="pricing-notice">
          <strong>{c("Free during launch", "上线期间免费")}</strong>
          <p>
            {c(
              "All features are currently available for free, with unlimited proposals. No credit card required. This is a temporary launch offer.",
              "当前所有功能免费开放，提案数量不限，无需信用卡。这是限时上线优惠。"
            )}
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <section className="pricing-plan" key={plan.name}>
              <span className="eyebrow">
                0{i + 1} / {c("THE PLAN", "方案")}
              </span>
              <h2>{plan.name}</h2>
              <p className="plan-description">{plan.note}</p>
              <div className="plan-price">
                $0<span>{c("during launch", "上线期间")}</span>
              </div>
              <p className="plan-note">
                {c("No payment details needed", "无需付款信息")}
              </p>
              <ul>
                {plan.features.map(f => (
                  <li key={f}>
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={i === 1 ? "default" : "outline"} asChild>
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  {c(
                    isAuthenticated ? "Go to workspace" : "Get started free",
                    isAuthenticated ? "前往工作空间" : "免费开始"
                  )}
                  <ArrowUpRight />
                </Link>
              </Button>
            </section>
          ))}
        </div>
        <p className="pricing-footnote">
          {c(
            "Every proposal stays yours. Review your scope, prices, and terms before sending. For questions about your account or the launch offer, contact",
            "每份提案都属于你。发送前请核对范围、报价和条款。如有账户或上线优惠相关问题，请联系"
          )}{" "}
          <a className="underline" href="mailto:hello@proposai.org">
            hello@proposai.org
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
