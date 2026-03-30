import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewProposal from "./pages/NewProposal";
import ProposalDetail from "./pages/ProposalDetail";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import ClientPortal from "./pages/ClientPortal";
import Templates from "./pages/Templates";
import ProposalEditor from "./pages/ProposalEditor";
import NewProposalFromTemplate from "./pages/NewProposalFromTemplate";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import CheckYourEmail from "./pages/CheckYourEmail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/check-your-email" component={CheckYourEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/proposals/new" component={NewProposal} />
      <Route path="/proposals/from-template" component={NewProposalFromTemplate} />
      <Route path="/proposals/:id/edit" component={(props: any) => <ProposalEditor proposalId={parseInt(props.params.id)} />} />
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
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
