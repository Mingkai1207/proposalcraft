import { Link } from "wouter";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEditorialCopy } from "@/lib/editorial";
import Brand from "./Brand";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "./ui/button";

export default function SiteHeader() {
  const { isAuthenticated } = useAuth();
  const c = useEditorialCopy();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-width site-header-row">
        <Brand />
        <nav className="site-links" aria-label={c("Main navigation", "主导航")}>
          <Link href="/#how-it-works">{c("The process", "使用流程")}</Link>
          <Link href="/#features">{c("Your workspace", "工作空间")}</Link>
          <Link href="/pricing">{c("Pricing", "价格")}</Link>
        </nav>
        <div className="site-header-actions">
          <LanguageSwitcher />
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="site-sign-in"
          >
            {c(
              isAuthenticated ? "Workspace" : "Sign in",
              isAuthenticated ? "工作空间" : "登录"
            )}
          </Link>
          <Button asChild className="site-start">
            <Link href={isAuthenticated ? "/proposals/new" : "/register"}>
              {c("Get started", "开始使用")}
              <ArrowUpRight />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="site-menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={c(
              open ? "Close menu" : "Open menu",
              open ? "关闭菜单" : "打开菜单"
            )}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          className="site-mobile-nav"
          aria-label={c("Mobile navigation", "移动端导航")}
        >
          {[
            ["/#how-it-works", c("The process", "使用流程")],
            ["/#features", c("Your workspace", "工作空间")],
            ["/pricing", c("Pricing", "价格")],
            [
              isAuthenticated ? "/dashboard" : "/login",
              c(
                isAuthenticated ? "Workspace" : "Sign in",
                isAuthenticated ? "工作空间" : "登录"
              ),
            ],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
