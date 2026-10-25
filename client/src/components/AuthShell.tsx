import type { ReactNode } from "react";
import Brand from "./Brand";
import LanguageSwitcher from "./LanguageSwitcher";
import { useEditorialCopy } from "@/lib/editorial";

export default function AuthShell({ children }: { children: ReactNode }) {
  const c = useEditorialCopy();
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Brand light />
        <div className="auth-story-copy">
          <h2>
            {c(
              "From job details to a good proposal.",
              "从工程细节，到一份好提案。"
            )}
          </h2>
          <p>
            {c(
              "Put your expertise on paper. A clear scope, thoughtful presentation, and a place to keep every job moving.",
              "让专业经验跃然纸上。清晰的范围、周全的呈现，让每个项目稳步推进。"
            )}
          </p>
          <div className="auth-story-note">
            <span>01</span>
            <p>
              {c(
                "Your details. Your business. Your name on the document.",
                "你的细节、你的业务、你的署名。"
              )}
            </p>
          </div>
        </div>
        <p className="auth-story-footer">
          ProposAI / {c("The proposal workspace", "提案工作空间")}
        </p>
      </aside>
      <main className="auth-main">
        <div className="auth-topbar">
          <Brand />
          <LanguageSwitcher />
        </div>
        <div className="auth-form">{children}</div>
      </main>
    </div>
  );
}
