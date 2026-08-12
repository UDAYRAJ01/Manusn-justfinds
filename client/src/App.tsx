import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageMeta } from "@/components/PageMeta";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminWorkspace from "./pages/AdminWorkspace";
import AuthEntry from "./pages/AuthEntry";
import BusinessDetail from "./pages/BusinessDetail";
import Categories from "./pages/Categories";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";
import OwnerWorkspace from "./pages/OwnerWorkspace";
import Saved from "./pages/Saved";
import SearchResults from "./pages/SearchResults";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/search" component={SearchResults} />
    <Route path="/categories" component={Categories} />
    <Route path="/login" component={AuthEntry} />
    <Route path="/signup" component={AuthEntry} />
    <Route path="/forgot-password" component={AuthEntry} />
    <Route path="/jobs" component={Jobs} />
    <Route path="/saved" component={Saved} />
    <Route path="/dashboard" component={OwnerWorkspace} />
    <Route path="/business" component={OwnerWorkspace} />
    <Route path="/business/:rest*" component={OwnerWorkspace} />
    <Route path="/owner" component={OwnerWorkspace} />
    <Route path="/owner/:rest*" component={OwnerWorkspace} />
    <Route path="/admin" component={AdminWorkspace} />
    <Route path="/admin/:rest*" component={AdminWorkspace} />
    <Route path="/:category/:city/:slug" component={BusinessDetail} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><PageMeta /><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
