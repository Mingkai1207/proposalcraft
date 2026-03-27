import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        howItWorks: "How It Works",
        features: "Features",
        pricing: "Pricing",
        faq: "FAQ",
        signIn: "Sign In",
        startFree: "Start Free",
        dashboard: "Dashboard",
      },
      // Hero
      hero: {
        badge: "AI PROPOSALS IN 60 SECONDS",
        title1: "Stop Losing Jobs to",
        title2: "Faster Contractors.",
        subtitle:
          "ProposAI generates professional, branded proposals for HVAC, plumbing, electrical, and roofing contractors in under 60 seconds — so you respond first and win more jobs.",
        ctaPrimary: "Start Free — No Credit Card",
        ctaSecondary: "See a Live Demo",
        trust1: "3 free proposals/month",
        trust2: "No credit card",
        trust3: "Cancel anytime",
      },
      // Walkthrough section
      walkthrough: {
        sectionBadge: "HOW IT WORKS",
        sectionTitle: "From job details to signed proposal in minutes",
        sectionSubtitle:
          "Three simple steps. No templates to fill out. No design skills needed.",
        step1Title: "Enter Job Details",
        step1Desc:
          "Tell ProposAI the client name, trade type, scope of work, and your price. Takes 30 seconds.",
        step2Title: "AI Writes Your Proposal",
        step2Desc:
          "Claude AI drafts a professional, detailed proposal with your branding, scope, timeline, and payment terms.",
        step3Title: "Send & Track",
        step3Desc:
          "Download as PDF or Word, email directly to your client, and get notified when they open it.",
        previewCard: {
          title: "Sample Output Preview",
          label: "HVAC Replacement Proposal",
          client: "Mr. John Smith",
          address: "123 Main St, Springfield",
          equipment: "Equipment & Materials",
          labor: "Labor & Installation",
          warranty: "Warranty & Service",
          total: "Total Investment",
          formats: "Output Formats",
          generatedIn: "Generated in 47 seconds",
        },
        step1Label: "Job Details",
        step2Label: "AI Generation",
        step3Label: "PDF Preview",
        generating: "AI is generating your proposal...",
        generatingDesc: "Analyzing job details and crafting professional content",
        proposalReady: "Proposal Ready",
        proposalReadyDesc: "Your professional proposal has been generated",
        downloadPdf: "Download PDF",
        downloadWord: "Download Word",
        viewClient: "View Client Portal",
        clientOpened: "Client opened your proposal",
        minutesAgo: "2 min ago",
      },
      // Features section
      features: {
        badge: "BUILT FOR CONTRACTORS",
        title: "Everything you need to win more jobs",
        subtitle:
          "ProposAI handles the paperwork so you can focus on the work.",
        items: {
          ai: {
            title: "AI-Powered Writing",
            desc: "Claude AI writes detailed, professional proposals tailored to your trade and scope of work.",
          },
          pdf: {
            title: "PDF & Word Export",
            desc: "Download polished proposals in PDF or Word format, ready to send or print.",
          },
          tracking: {
            title: "Proposal Tracking",
            desc: "Know exactly when your client opens your proposal so you can follow up at the right moment.",
          },
          email: {
            title: "Direct Email Delivery",
            desc: "Send proposals directly to clients from ProposAI with a professional email template.",
          },
          templates: {
            title: "Trade Templates",
            desc: "Pre-built templates for HVAC, plumbing, electrical, roofing, and more.",
          },
          branding: {
            title: "Your Branding",
            desc: "Add your company logo, colors, and contact info for a fully branded experience.",
          },
        },
      },
      // Pricing section
      pricing: {
        badge: "SIMPLE PRICING",
        title: "Start free, upgrade when you're ready",
        subtitle: "No hidden fees. Cancel anytime.",
        free: {
          name: "Free",
          price: "$0",
          period: "/month",
          desc: "Perfect for trying out ProposAI",
          cta: "Get Started Free",
        },
        starter: {
          name: "Starter",
          price: "$5.99",
          period: "/month",
          desc: "For growing contractors",
          cta: "Upgrade to Starter",
          popular: "MOST POPULAR",
        },
        pro: {
          name: "Pro",
          price: "$9.99",
          period: "/month",
          desc: "For high-volume contractors",
          cta: "Upgrade to Pro",
        },
        perMonth: "per month",
        includes: "Includes:",
        currentPlan: "Current Plan",
        upgrade: "Upgrade",
      },
      // FAQ
      faq: {
        badge: "FAQ",
        title: "Frequently Asked Questions",
        items: {
          q1: "What trades does ProposAI support?",
          a1: "ProposAI supports HVAC, plumbing, electrical, roofing, general contracting, landscaping, painting, and more. If you can describe the job, ProposAI can write the proposal.",
          q2: "How long does it take to generate a proposal?",
          a2: "Most proposals are generated in under 60 seconds. Complex multi-trade jobs may take up to 2 minutes.",
          q3: "Can I customize the proposals?",
          a3: "Yes. After generation, you can edit any part of the proposal in our rich text editor before downloading or sending.",
          q4: "Do clients need a ProposAI account to view proposals?",
          a4: "No. Clients receive a link to a branded client portal where they can view, accept, or request changes — no account required.",
          q5: "What AI model does ProposAI use?",
          a5: "Free and Starter users use Claude Sonnet 4.6. Pro users get access to Claude Opus 4.6, Anthropic's most capable model.",
          q6: "Can I cancel anytime?",
          a6: "Yes. Cancel your subscription anytime from your account settings. You'll keep access until the end of your billing period.",
        },
      },
      // CTA section
      cta: {
        title: "Ready to win more jobs?",
        subtitle:
          "Join thousands of contractors who use ProposAI to respond faster and win more bids.",
        primary: "Start Free Today",
        secondary: "See Pricing",
      },
      // Footer
      footer: {
        tagline: "AI-powered proposals for trade contractors.",
        product: "Product",
        company: "Company",
        legal: "Legal",
        links: {
          features: "Features",
          pricing: "Pricing",
          templates: "Templates",
          about: "About",
          blog: "Blog",
          contact: "Contact",
          terms: "Terms of Service",
          privacy: "Privacy Policy",
          refund: "Refund Policy",
        },
        copyright: "© {{year}} ProposAI. All rights reserved.",
      },
      // Dashboard
      dashboard: {
        welcome: "Welcome back",
        newProposal: "New Proposal",
        proposals: "Proposals",
        templates: "Templates",
        settings: "Settings",
        billing: "Billing",
        signOut: "Sign Out",
        plan: "Plan",
        freePlan: "Free Plan",
        starterPlan: "Starter Plan",
        proPlan: "Pro Plan",
        proposalsUsed: "{{used}} / {{total}} proposals used",
        unlimited: "Unlimited",
      },
      // Common
      common: {
        loading: "Loading...",
        error: "Something went wrong",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        back: "Back",
        next: "Next",
        submit: "Submit",
        close: "Close",
        learnMore: "Learn More",
        getStarted: "Get Started",
      },
    },
  },
  zh: {
    translation: {
      // Navigation
      nav: {
        howItWorks: "使用方法",
        features: "功能特色",
        pricing: "价格方案",
        faq: "常见问题",
        signIn: "登录",
        startFree: "免费开始",
        dashboard: "控制台",
      },
      // Hero
      hero: {
        badge: "60秒内生成AI报价单",
        title1: "不再因为速度慢",
        title2: "而失去客户。",
        subtitle:
          "ProposAI 为暖通空调、水管、电气和屋顶承包商在60秒内生成专业的品牌报价单——让您第一时间响应，赢得更多工程。",
        ctaPrimary: "免费开始 — 无需信用卡",
        ctaSecondary: "查看演示",
        trust1: "每月3份免费报价单",
        trust2: "无需信用卡",
        trust3: "随时取消",
      },
      // Walkthrough section
      walkthrough: {
        sectionBadge: "使用流程",
        sectionTitle: "从工程详情到签署报价单，只需几分钟",
        sectionSubtitle: "三个简单步骤。无需填写模板。无需设计技能。",
        step1Title: "输入工程详情",
        step1Desc: "告诉 ProposAI 客户姓名、工程类型、工作范围和报价。只需30秒。",
        step2Title: "AI 撰写报价单",
        step2Desc:
          "Claude AI 起草一份包含您品牌、范围、时间表和付款条款的专业详细报价单。",
        step3Title: "发送并追踪",
        step3Desc: "下载为 PDF 或 Word，直接发送给客户，并在客户打开时收到通知。",
        previewCard: {
          title: "示例输出预览",
          label: "暖通空调更换报价单",
          client: "John Smith 先生",
          address: "Springfield 市 Main St 123号",
          equipment: "设备与材料",
          labor: "人工与安装",
          warranty: "保修与服务",
          total: "总投资",
          formats: "输出格式",
          generatedIn: "47秒内生成",
        },
        step1Label: "工程详情",
        step2Label: "AI 生成",
        step3Label: "PDF 预览",
        generating: "AI 正在生成您的报价单...",
        generatingDesc: "分析工程详情并撰写专业内容",
        proposalReady: "报价单已就绪",
        proposalReadyDesc: "您的专业报价单已生成",
        downloadPdf: "下载 PDF",
        downloadWord: "下载 Word",
        viewClient: "查看客户门户",
        clientOpened: "客户已打开您的报价单",
        minutesAgo: "2分钟前",
      },
      // Features section
      features: {
        badge: "专为承包商打造",
        title: "赢得更多工程所需的一切",
        subtitle: "ProposAI 处理文书工作，让您专注于实际工作。",
        items: {
          ai: {
            title: "AI 智能撰写",
            desc: "Claude AI 根据您的工程类型和工作范围撰写详细、专业的报价单。",
          },
          pdf: {
            title: "PDF 和 Word 导出",
            desc: "以 PDF 或 Word 格式下载精美的报价单，随时可发送或打印。",
          },
          tracking: {
            title: "报价单追踪",
            desc: "准确了解客户何时打开您的报价单，以便在最佳时机跟进。",
          },
          email: {
            title: "直接邮件发送",
            desc: "使用专业邮件模板直接从 ProposAI 向客户发送报价单。",
          },
          templates: {
            title: "行业模板",
            desc: "提供暖通空调、水管、电气、屋顶等行业的预制模板。",
          },
          branding: {
            title: "您的品牌",
            desc: "添加公司标志、颜色和联系信息，打造完全品牌化的体验。",
          },
        },
      },
      // Pricing section
      pricing: {
        badge: "简单透明的价格",
        title: "免费开始，准备好了再升级",
        subtitle: "无隐藏费用。随时取消。",
        free: {
          name: "免费版",
          price: "$0",
          period: "/月",
          desc: "非常适合试用 ProposAI",
          cta: "免费开始",
        },
        starter: {
          name: "入门版",
          price: "$5.99",
          period: "/月",
          desc: "适合成长中的承包商",
          cta: "升级到入门版",
          popular: "最受欢迎",
        },
        pro: {
          name: "专业版",
          price: "$9.99",
          period: "/月",
          desc: "适合高产量承包商",
          cta: "升级到专业版",
        },
        perMonth: "每月",
        includes: "包含：",
        currentPlan: "当前方案",
        upgrade: "升级",
      },
      // FAQ
      faq: {
        badge: "常见问题",
        title: "常见问题解答",
        items: {
          q1: "ProposAI 支持哪些行业？",
          a1: "ProposAI 支持暖通空调、水管、电气、屋顶、总承包、园林绿化、油漆等更多行业。只要您能描述工程，ProposAI 就能撰写报价单。",
          q2: "生成一份报价单需要多长时间？",
          a2: "大多数报价单在60秒内生成。复杂的多工种工程可能需要最多2分钟。",
          q3: "我可以自定义报价单吗？",
          a3: "可以。生成后，您可以在我们的富文本编辑器中编辑报价单的任何部分，然后再下载或发送。",
          q4: "客户需要 ProposAI 账户才能查看报价单吗？",
          a4: "不需要。客户收到一个品牌化客户门户的链接，可以在那里查看、接受或请求修改——无需账户。",
          q5: "ProposAI 使用哪种 AI 模型？",
          a5: "免费版和入门版用户使用 Claude Sonnet 4.6。专业版用户可以使用 Claude Opus 4.6，这是 Anthropic 最强大的模型。",
          q6: "我可以随时取消吗？",
          a6: "可以。随时从您的账户设置中取消订阅。您将保留访问权限直到计费周期结束。",
        },
      },
      // CTA section
      cta: {
        title: "准备好赢得更多工程了吗？",
        subtitle: "加入数千名使用 ProposAI 更快响应、赢得更多投标的承包商。",
        primary: "立即免费开始",
        secondary: "查看价格",
      },
      // Footer
      footer: {
        tagline: "为贸易承包商提供 AI 驱动的报价单。",
        product: "产品",
        company: "公司",
        legal: "法律",
        links: {
          features: "功能特色",
          pricing: "价格方案",
          templates: "模板",
          about: "关于我们",
          blog: "博客",
          contact: "联系我们",
          terms: "服务条款",
          privacy: "隐私政策",
          refund: "退款政策",
        },
        copyright: "© {{year}} ProposAI 版权所有。",
      },
      // Dashboard
      dashboard: {
        welcome: "欢迎回来",
        newProposal: "新建报价单",
        proposals: "报价单",
        templates: "模板",
        settings: "设置",
        billing: "账单",
        signOut: "退出登录",
        plan: "方案",
        freePlan: "免费方案",
        starterPlan: "入门方案",
        proPlan: "专业方案",
        proposalsUsed: "已使用 {{used}} / {{total}} 份报价单",
        unlimited: "无限制",
      },
      // Common
      common: {
        loading: "加载中...",
        error: "出现错误",
        save: "保存",
        cancel: "取消",
        delete: "删除",
        edit: "编辑",
        back: "返回",
        next: "下一步",
        submit: "提交",
        close: "关闭",
        learnMore: "了解更多",
        getStarted: "立即开始",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "proposai-language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
