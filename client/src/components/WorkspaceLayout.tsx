import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Plus,
  Files,
  Upload,
  Settings,
  LogOut,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEditorialCopy } from "@/lib/editorial";
import Brand from "./Brand";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const c = useEditorialCopy();
  const links = [
    { href: "/dashboard", label: c("Overview", "概览"), icon: LayoutDashboard },
    {
      href: "/proposals/new",
      label: c("New proposal", "新建提案"),
      icon: Plus,
    },
    { href: "/templates", label: c("Templates", "模板"), icon: Files },
    { href: "/import", label: c("Import proposals", "导入提案"), icon: Upload },
    {
      href: "/settings",
      label: c("Business settings", "业务设置"),
      icon: Settings,
    },
  ];
  const nav = (
    <>
      <div className="workspace-brand">
        <Brand />
      </div>
      <div className="workspace-nav-label eyebrow">
        {c("YOUR WORKSPACE", "你的工作空间")}
      </div>
      <nav
        aria-label={c("Workspace navigation", "工作空间导航")}
        className="workspace-nav"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            location === href ||
            (href === "/templates" && location === "/proposals/from-template");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="workspace-bottom">
        <div className="workspace-launch">
          <span className="eyebrow">{c("LAUNCH ACCESS", "上线体验")}</span>
          <p>{c("Room for your next job.", "为下一个项目做好准备。")}</p>
          <Link href="/pricing" onClick={() => setOpen(false)}>
            {c("All features, free for now", "上线期间，全部功能免费")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="workspace-user">
          <span className="workspace-avatar">
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </span>
          <div>
            <strong>{user?.name || c("Your account", "你的账户")}</strong>
            <span>{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label={c("Sign out", "退出登录")}
          >
            <LogOut size={17} />
          </Button>
        </div>
      </div>
    </>
  );
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">{nav}</aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <Button
            variant="ghost"
            size="icon"
            className="workspace-menu"
            onClick={() => setOpen(true)}
            aria-label={c("Open navigation", "打开导航")}
          >
            <Menu />
          </Button>
          <span className="workspace-header-label">
            {c("The proposal workspace", "提案工作空间")}
          </span>
          <Link href="/" className="workspace-site-link">
            {c("Visit website", "访问网站")}
            <ArrowUpRight size={14} />
          </Link>
          <LanguageSwitcher />
        </header>
        <div className="workspace-content">{children}</div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="workspace-mobile-sidebar">
          <SheetTitle className="sr-only">
            {c("Workspace navigation", "工作空间导航")}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {c(
              "Navigate your proposals and business settings",
              "访问提案与业务设置"
            )}
          </SheetDescription>
          {nav}
        </SheetContent>
      </Sheet>
    </div>
  );
}
