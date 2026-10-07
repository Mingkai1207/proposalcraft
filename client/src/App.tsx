import WorkspaceLayout from "./components/WorkspaceLayout";
import { useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewProposal = lazy(() => import("./pages/NewProposal"));
const ProposalDetail = lazy(() => import("./pages/ProposalDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Templates = lazy(() => import("./pages/Templates"));
const ProposalEditor = lazy(() => import("./pages/ProposalEditor"));
const NewProposalFromTemplate = lazy(
  () => import("./pages/NewProposalFromTemplate")
);
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CheckYourEmail = lazy(() => import("./pages/CheckYourEmail"));
const ProposalImport = lazy(() => import("./pages/ProposalImport"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status" aria-label="Loading page">
          <span />
        </div>
      }
    >
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/check-your-email" component={CheckYourEmail} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/proposals/new" component={NewProposal} />
        <Route
          path="/proposals/from-template"
          component={NewProposalFromTemplate}
        />
        <Route path="/import" component={ProposalImport} />
        <Route
          path="/proposals/:id/edit"
          component={(props: any) => (
            <ProposalEditor proposalId={parseInt(props.params.id)} />
          )}
        />
        <Route path="/proposals/:id" component={ProposalDetail} />
        <Route path="/settings" component={Settings} />
        <Route path="/templates" component={Templates} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
        <Route path="/client-portal" component={ClientPortal} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PageFrame() {
  const [location] = useLocation();
  const workspace =
    /^\/(dashboard|proposals|templates|import|settings)(\/|$)/.test(location);
  return workspace ? (
    <WorkspaceLayout>
      <Router />
    </WorkspaceLayout>
  ) : (
    <Router />
  );
}

function App() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language.startsWith("zh")
      ? "zh"
      : "en";
  }, [i18n.language]);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PageFrame />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
