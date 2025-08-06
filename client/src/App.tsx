import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Books from "@/pages/books";
import Analytics from "@/pages/analytics";
import KDPReports from "@/pages/kdp-reports";
import AIAssistant from "@/pages/ai-assistant";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";
import AdminConfig from "@/pages/admin-config";
import AdminAudit from "@/pages/admin-audit";
import AdminBlogPosts from "@/pages/admin-blog-posts";
import AdminBlogCategories from "@/pages/admin-blog-categories";
import AdminSystem from "@/pages/admin-system";
import AdminPrompts from "@/pages/admin-prompts";
import AdminCron from "@/pages/admin-cron";
import AIConfig from "@/pages/admin/ai-config";
import AIVariables from "@/pages/admin/ai-variables";
import AIFunctions from "@/pages/ai-functions";
import ProjectCreate from "@/pages/project-create-simple";
import ProjectEdit from "@/pages/project-edit";
import BookCreate from "@/pages/book-create";
import BookEdit from "@/pages/book-edit";
import ManageSeries from "@/pages/manage-series";
import SeriesEdit from "@/pages/series-edit";
import SeriesCreate from "@/pages/series-create";
import SeriesSetup from "@/pages/series-setup";
import AuthorsListPage from "@/pages/authors-list";
import AuthorCreatePage from "@/pages/author-create";
import AuthorViewPage from "@/pages/author-view";
import ImportManagement from "@/pages/ImportManagement";
import ExchangeRates from "@/pages/ExchangeRates";
import MasterBooksPage from "@/pages/master-books";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Always render all routes, handle auth in components */}
      <Route path="/" component={isLoading || !isAuthenticated ? Landing : Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/books" component={Books} />
      <Route path="/authors" component={AuthorsListPage} />
      <Route path="/authors/create" component={AuthorCreatePage} />
      <Route path="/authors/:authorId" component={AuthorViewPage} />
      <Route path="/manage-series" component={ManageSeries} />
      <Route path="/series-create" component={SeriesCreate} />
      <Route path="/series-setup" component={SeriesSetup} />
      <Route path="/series-setup/:seriesId" component={SeriesSetup} />
      <Route path="/series-edit/:seriesId" component={SeriesEdit} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/master-books" component={MasterBooksPage} />
      <Route path="/exchange-rates" component={ExchangeRates} />
      <Route path="/kdp-reports" component={KDPReports} />
      <Route path="/import-management" component={ImportManagement} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/ai-functions" component={AIFunctions} />
      <Route path="/admin/ai-variables" component={AIVariables} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/config" component={AdminConfig} />
      <Route path="/admin/audit" component={AdminAudit} />
      <Route path="/admin/ai-config" component={AIConfig} />
      <Route path="/admin/cron" component={AdminCron} />
      <Route path="/admin/system" component={AdminSystem} />
      <Route path="/admin/prompts" component={AdminPrompts} />
      <Route path="/admin/blog-posts" component={AdminBlogPosts} />
      <Route path="/admin/blog-categories" component={AdminBlogCategories} />
      <Route path="/projects/create" component={ProjectCreate} />
      <Route path="/project-create-simple" component={ProjectCreate} />
      <Route path="/projects/edit/:id" component={ProjectEdit} />
      <Route path="/books/create" component={BookEdit} />
      <Route path="/books/edit/:bookId" component={BookEdit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
