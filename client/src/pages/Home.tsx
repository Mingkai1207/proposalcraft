import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ArrowUpRight, Plus, Minus, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEditorialCopy } from "@/lib/editorial";
import {
  trackCtaClick,
  trackPdfDownload,
  trackWalkthroughStep,
} from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import ProposalPreview from "@/components/ProposalPreview";
import Footer from "@/components/Footer";

const SAMPLE_PDF =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/pasted_file_1SBXzL_HVAC_Replacement_Proposal_JohnSmith_edb68410.pdf";

export default function Home() {
  const c = useEditorialCopy();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [demoStep, setDemoStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const start = () => {
    trackCtaClick("get_started");
    navigate(isAuthenticated ? "/proposals/new" : "/register");
  };
  const steps = [
    {
      name: c("Start with the job.", "从项目开始。"),
      text: c(
        "Tell us what you're doing, who it's for, and what it will cost. Your saved business details fill themselves in.",
        "填写工作内容、客户和费用，已保存的业务信息会自动填入。"
      ),
    },
    {
      name: c("Make it your own.", "让提案属于你。"),
      text: c(
        "Review the draft, refine the wording, and use your own format. You decide what goes to your client.",
        "审阅草稿、调整措辞，使用自己的格式。由你决定最终发送给客户的内容。"
      ),
    },
    {
      name: c("Send with confidence.", "放心发送。"),
      text: c(
        "Export a polished document or send it directly. Keep the proposal and your client's response in one place.",
        "导出完整文档或直接发送，在同一处管理提案和客户回复。"
      ),
    },
  ];
  const faqs = [
    [
      c("Can I use my own proposal format?", "可以使用自己的提案格式吗？"),
      c(
        "Yes. Upload a past proposal or save a proposal as a template. New proposals can follow that structure, with the details of each new job.",
        "可以。上传过去的提案，或将已有提案保存为模板，新提案可以沿用其结构并填入新的项目细节。"
      ),
    ],
    [
      c("Can I edit a draft before sending?", "发送前可以编辑草稿吗？"),
      c(
        "Yes. Review and edit the draft in the proposal editor, or describe a revision. Always check the scope, pricing, and terms before sending it to your client.",
        "可以。在编辑器中审阅并编辑草稿，或描述需要修改的内容。发送前请核对工作范围、报价和条款。"
      ),
    ],
    [
      c("Which file formats are available?", "支持哪些文件格式？"),
      c(
        "ProposAI supports PDF, Word, and Google Doc exports. You can also send proposals by email and track client responses from your workspace.",
        "ProposAI 支持 PDF、Word 和 Google Doc 导出，也可以通过邮件发送并在工作空间中跟踪客户回复。"
      ),
    ],
    [
      c("What does it cost during launch?", "上线期间如何收费？"),
      c(
        "All plans are currently free during the launch period, with unlimited proposals. You don't need a credit card to get started. See the pricing page for the current offer.",
        "上线期间所有方案免费，提案数量不限。开始使用无需信用卡。当前优惠详情请查看价格页面。"
      ),
    ],
  ];
  return (
    <div className="editorial-site">
      <SiteHeader />
      <main>
        <section className="site-width home-hero">
          <div className="hero-copy">
            <div className="eyebrow hero-kicker">
              <span className="small-rule" />
              {c(
                "THE PROPOSAL WORKSPACE FOR THE TRADES",
                "面向工程行业的提案工作空间"
              )}
            </div>
            <h1>
              {c("Your work,", "你的工程，")}
              <br />
              <em>{c("well presented.", "值得好好呈现。")}</em>
            </h1>
            <p className="hero-description">
              {c(
                "You know the job. Put it into a proposal that feels just as considered — clear scope, honest pricing, and your name on every page.",
                "你了解每一项工程。用同样周全的提案呈现它：清晰的工作范围、透明的报价，以及每页属于你的署名。"
              )}
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => start()}>
                {c("Write your first proposal", "撰写第一份提案")}
                <ArrowUpRight />
              </Button>
              <a href="#walkthrough" className="text-link">
                {c("Take a closer look", "进一步了解")}
                <ArrowRight size={16} />
              </a>
            </div>
            <p className="hero-fineprint">
              {c(
                "Free during launch. No credit card required.",
                "上线期间免费，无需信用卡。"
              )}
            </p>
            <div className="hero-trades">
              <span>HVAC</span>
              <span>{c("Plumbing", "管道")}</span>
              <span>{c("Electrical", "电气")}</span>
              <span>{c("Roofing", "屋面")}</span>
            </div>
          </div>
          <div className="hero-document">
            <div className="document-caption">
              <span>{c("A BETTER FIRST IMPRESSION", "更好的第一印象")}</span>
              <span>↗</span>
            </div>
            <ProposalPreview />
            <div className="document-caption document-caption-bottom">
              <span>
                {c(
                  "ILLUSTRATIVE SAMPLE · HVAC REPLACEMENT",
                  "示例 · 暖通系统更换"
                )}
              </span>
              <span>01</span>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="process-section">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  01 / {c("THE PROCESS", "使用流程")}
                </span>
                <h2>
                  {c("A little less paperwork.", "少一点文书工作。")}
                  <br />
                  <em>{c("A little more progress.", "多一点项目进展。")}</em>
                </h2>
              </div>
              <p>
                {c(
                  "From the details in your head to a document in your client's hands. Three simple stages, with you in control.",
                  "从脑海中的细节，到客户手中的文档。三个简单阶段，全程由你掌握。"
                )}
              </p>
            </div>
            <div className="process-rows">
              {steps.map((step, i) => (
                <div className="process-row" key={step.name}>
                  <span className="process-number">0{i + 1}</span>
                  <h3>{step.name}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="walkthrough" className="site-width walkthrough-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                02 / {c("A CLOSER LOOK", "进一步了解")}
              </span>
              <h2>
                {c("The details become", "让项目细节")}
                <br />
                <em>{c("the document.", "成为完整提案。")}</em>
              </h2>
            </div>
            <p>
              {c(
                "Explore an example HVAC job. This walkthrough uses sample content so you can see the process before signing up.",
                "查看一个暖通工程示例。这是使用示例内容的流程演示，让你在注册前了解产品。"
              )}
            </p>
          </div>
          <div className="walkthrough-grid">
            <div className="walkthrough-controls">
              <div
                role="tablist"
                aria-label={c("Sample proposal stages", "提案示例阶段")}
                className="demo-tabs"
              >
                {[
                  c("Job details", "项目详情"),
                  c("Draft & review", "草稿与审阅"),
                  c("Ready to send", "准备发送"),
                ].map((label, i) => (
                  <button
                    key={label}
                    id={`demo-tab-${i}`}
                    role="tab"
                    tabIndex={demoStep === i ? 0 : -1}
                    onKeyDown={event => {
                      const direction =
                        event.key === "ArrowRight"
                          ? 1
                          : event.key === "ArrowLeft"
                            ? -1
                            : 0;
                      if (!direction) return;
                      event.preventDefault();
                      const next = (i + direction + 3) % 3;
                      setDemoStep(next);
                      document.getElementById(`demo-tab-${next}`)?.focus();
                    }}
                    aria-selected={demoStep === i}
                    aria-controls="demo-panel"
                    onClick={() => {
                      setDemoStep(i);
                      trackWalkthroughStep(
                        i === 0
                          ? "form_start"
                          : i === 1
                            ? "form_complete"
                            : "pdf_view",
                        { sample: true }
                      );
                    }}
                  >
                    <span>0{i + 1}</span>
                    {label}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <div
                id="demo-panel"
                role="tabpanel"
                aria-labelledby={`demo-tab-${demoStep}`}
                className="demo-detail"
                key={demoStep}
              >
                {demoStep === 0 ? (
                  <>
                    <span className="eyebrow">
                      {c("THE JOB NOTES", "项目笔记")}
                    </span>
                    <h3>
                      {c("A new system for John.", "为 John 更换新系统。")}
                    </h3>
                    <dl>
                      <div>
                        <dt>{c("Trade", "行业")}</dt>
                        <dd>HVAC</dd>
                      </div>
                      <div>
                        <dt>{c("Client", "客户")}</dt>
                        <dd>John Smith</dd>
                      </div>
                      <div>
                        <dt>{c("Budget", "预算")}</dt>
                        <dd>$8,500</dd>
                      </div>
                    </dl>
                    <p>
                      {c(
                        "Replace the existing HVAC system with a Carrier condenser, furnace, and smart thermostat. Allow five working days for installation and commissioning.",
                        "用 Carrier 冷凝机组、暖炉和智能恒温器更换原有系统。安装和调试预计需要五个工作日。"
                      )}
                    </p>
                  </>
                ) : demoStep === 1 ? (
                  <>
                    <span className="eyebrow">{c("THE REVIEW", "审阅")}</span>
                    <h3>
                      {c("Every detail, in its place.", "让每个细节各就其位。")}
                    </h3>
                    <p>
                      {c(
                        "The draft brings together scope, an itemized estimate, project duration, and business details. Check the assumptions and adjust the wording before it leaves your desk.",
                        "草稿汇总了工作范围、费用明细、工期和业务信息。发送前核对条件并调整措辞。"
                      )}
                    </p>
                    <ul className="review-checklist">
                      <li>{c("Scope of work", "工作范围")}</li>
                      <li>{c("Materials and labor", "材料与人工")}</li>
                      <li>{c("Timeline and terms", "工期与条款")}</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">
                      {c("THE FINISHED DOCUMENT", "完成后的文档")}
                    </span>
                    <h3>
                      {c("Ready for the next step.", "准备好迈向下一步。")}
                    </h3>
                    <p>
                      {c(
                        "Download an existing sample PDF to see the document output. Your own proposals can be exported or emailed from the workspace.",
                        "下载已有的 PDF 示例，查看文档输出。你自己的提案可以在工作空间中导出或通过邮件发送。"
                      )}
                    </p>
                    <Button variant="outline" asChild>
                      <a
                        href={SAMPLE_PDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackPdfDownload("editorial_sample")}
                      >
                        <Download />
                        {c("Open sample PDF", "打开 PDF 示例")}
                      </a>
                    </Button>
                  </>
                )}
              </div>
              <button
                className="text-link demo-next"
                onClick={() =>
                  demoStep < 2 ? setDemoStep(d => d + 1) : start()
                }
              >
                {c(
                  demoStep < 2 ? "Next stage" : "Try it with your job",
                  demoStep < 2 ? "下一阶段" : "尝试自己的项目"
                )}
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="walkthrough-document">
              <ProposalPreview compact />
              <p className="sample-note">
                {c(
                  "Illustrative document layout. Sample prices and business details.",
                  "文档布局示意，使用示例价格与业务信息。"
                )}
              </p>
            </div>
          </div>
        </section>
        <section id="features" className="workspace-feature-section">
          <div className="site-width feature-layout">
            <div>
              <span className="eyebrow">
                03 / {c("YOUR WORKSPACE", "你的工作空间")}
              </span>
              <h2>
                {c("A place for", "让每份提案")}
                <br />
                <em>{c("every proposal.", "都有归属。")}</em>
              </h2>
              <p>
                {c(
                  "Keep the useful parts of your process. Bring your templates, add your branding, and carry the work through to the client's reply.",
                  "保留你熟悉的工作方式。导入模板、添加品牌信息，从撰写一路管理到客户回复。"
                )}
              </p>
              <Button variant="outline" onClick={() => start()}>
                {c("Open your workspace", "打开工作空间")}
                <ArrowUpRight />
              </Button>
            </div>
            <div className="feature-list">
              {[
                [
                  c("Your format, saved.", "保存自己的格式。"),
                  c(
                    "Upload an existing document or save a good proposal as a template. Start the next job with what already works.",
                    "上传现有文档，或把满意的提案保存为模板，用成熟的格式开始下一个项目。"
                  ),
                ],
                [
                  c("Your business, on the page.", "让文档呈现你的业务。"),
                  c(
                    "Save your logo, contact details, and business information once. Give each document a consistent identity.",
                    "保存标志、联系方式和业务信息，让每份文档保持一致的品牌形象。"
                  ),
                ],
                [
                  c("Room to refine.", "留出打磨的空间。"),
                  c(
                    "Edit the proposal yourself or request a revision. Export to PDF, Word, or Google Doc when you're happy with it.",
                    "自行编辑或请求修改，确认满意后导出 PDF、Word 或 Google Doc。"
                  ),
                ],
                [
                  c("Follow the conversation.", "跟进客户沟通。"),
                  c(
                    "Send proposals, track opens, and review client responses. Know which jobs need your attention next.",
                    "发送提案、跟踪打开情况并查看客户回复，了解接下来需要跟进的项目。"
                  ),
                ],
              ].map(([title, text], i) => (
                <div className="feature-item" key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="site-width launch-section">
          <div>
            <span className="eyebrow">
              {c("AN OPEN INVITATION", "诚邀体验")}
            </span>
            <h2>
              {c("Your next proposal", "你的下一份提案")}
              <br />
              <em>{c("starts here.", "从这里开始。")}</em>
            </h2>
          </div>
          <div className="launch-copy">
            <p>
              {c(
                "During our launch, every plan is free. Explore the workspace, bring a real job, and see how it fits your day.",
                "上线期间每个方案免费。探索工作空间，带来一个真实项目，看看它如何融入你的日常。"
              )}
            </p>
            <Button size="lg" onClick={() => start()}>
              {c("Get started, free", "免费开始")}
              <ArrowUpRight />
            </Button>
            <Link href="/pricing" className="text-link">
              {c("See what's included", "查看包含的功能")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <section id="faq" className="site-width faq-section">
          <div>
            <span className="eyebrow">
              {c("A FEW PRACTICAL QUESTIONS", "几个实用问题")}
            </span>
            <h2>{c("Before you begin.", "开始之前。")}</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <div className="faq-item" key={q}>
                <h3>
                  <button
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {q}
                    {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </h3>
                <div id={`faq-answer-${i}`} hidden={openFaq !== i}>
                  <p>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
