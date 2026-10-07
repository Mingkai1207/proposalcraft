import { useEditorialCopy } from "@/lib/editorial";

export default function ProposalPreview({
  compact = false,
}: {
  compact?: boolean;
}) {
  const c = useEditorialCopy();
  return (
    <article
      className={`proposal-paper ${compact ? "proposal-paper-compact" : ""}`}
      aria-label={c("Sample HVAC proposal", "暖通工程提案示例")}
    >
      <div className="paper-letterhead">
        <span>
          NORTHLINE
          <span className="paper-letterhead-sub">
            {c("HEATING & AIR", "暖通与空调")}
          </span>
        </span>
        <span className="paper-reference">P—024</span>
      </div>
      <div className="paper-heading">
        <span className="eyebrow">{c("PROJECT PROPOSAL", "工程提案")}</span>
        <h3>{c("Comfort, restored.", "舒适，再次回归。")}</h3>
        <p>{c("HVAC system replacement", "暖通空调系统更换")}</p>
      </div>
      <div className="paper-client">
        <div>
          <span>{c("PREPARED FOR", "客户")}</span>
          <strong>John Smith</strong>
          <p>123 Main St., Austin, TX</p>
        </div>
        <div>
          <span>{c("PROJECT DURATION", "工期")}</span>
          <strong>{c("5 working days", "5 个工作日")}</strong>
        </div>
      </div>
      <section className="paper-scope">
        <h4>01 / {c("Scope of work", "工作范围")}</h4>
        <p>
          {c(
            "Remove the existing system. Supply and install a new Carrier condenser, furnace, and smart thermostat. Test, commission, and leave the site clean.",
            "拆除现有系统，供应并安装 Carrier 冷凝机组、暖炉和智能恒温器。完成测试与调试，并清理施工现场。"
          )}
        </p>
      </section>
      <section className="paper-costs">
        <h4>02 / {c("Your investment", "费用明细")}</h4>
        <dl>
          {[
            [c("Equipment & materials", "设备与材料"), "$5,200"],
            [c("Labor & installation", "人工与安装"), "$2,100"],
            [c("Permits & inspection", "许可与检查"), "$1,200"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div className="paper-total">
            <dt>{c("Total estimate", "预估总价")}</dt>
            <dd>
              $8,500<span>.00</span>
            </dd>
          </div>
        </dl>
      </section>
      <div className="paper-foot">
        <span>
          {c("Clear scope. Considered details.", "范围清晰，细节周全。")}
        </span>
        <span>01 / 02</span>
      </div>
    </article>
  );
}
