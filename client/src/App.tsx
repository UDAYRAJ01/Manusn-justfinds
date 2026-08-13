import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageMeta } from "@/components/PageMeta";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminWorkspace from "./pages/AdminWorkspace";
import AuthEntry from "./pages/AuthEntry";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessPlatform from "./pages/BusinessPlatform";
import BusinessTools from "./pages/BusinessTools";
import Categories from "./pages/Categories";
import { CategoryLanding, CityLanding } from "./pages/DiscoveryLanding";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";
import OwnerWorkspace from "./pages/OwnerWorkspace";
import Saved from "./pages/Saved";
import SearchResults from "./pages/SearchResults";
import VerifyBusiness from "./pages/VerifyBusiness";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/search" component={SearchResults} />
    <Route path="/categories" component={Categories} />
    <Route path="/category/:category/:subcategory" component={CategoryLanding} />
    <Route path="/category/:category" component={CategoryLanding} />
    <Route path="/city/:city/:locality" component={CityLanding} />
    <Route path="/city/:city" component={CityLanding} />
    <Route path="/login" component={AuthEntry} />
    <Route path="/signup" component={AuthEntry} />
    <Route path="/forgot-password" component={AuthEntry} />
    <Route path="/jobs" component={Jobs} />
    <Route path="/saved" component={Saved} />
    <Route path="/dashboard" component={OwnerWorkspace} />
    <Route path="/business" component={BusinessPlatform} />
    <Route path="/business/onboarding" component={BusinessPlatform} />
    <Route path="/business/:businessId/:tool" component={BusinessToolRoute} />
    <Route path="/business/:rest*" component={BusinessPlatform} />
    <Route path="/owner" component={OwnerWorkspace} />
    <Route path="/owner/:rest*" component={OwnerWorkspace} />
    <Route path="/admin" component={AdminWorkspace} />
    <Route path="/admin/:rest*" component={AdminWorkspace} />
    <Route path="/verify/:slug" component={VerifyBusiness} />
    <Route path="/:category/:city/:slug" component={BusinessDetail} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function BusinessToolRoute({ params }: { params: { businessId: string; tool: string } }) {
  return <BusinessTools businessId={Number(params.businessId)} businessName={`Business #${params.businessId}`} />;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><PageMeta /><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
