import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FolderOpen, 
  TrendingUp, 
  Upload, 
  Bot, 
  Crown, 
  Settings,
  Shield,
  FileText,
  Folder
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import logoImage from "@assets/image_1753719885932.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Sales Analytics", href: "/analytics", icon: TrendingUp },
  { name: "KDP Reports", href: "/kdp-reports", icon: Upload },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot, badge: "PRO" },
];

const accountNavigation = [
  { name: "Subscription", href: "/subscription", icon: Crown },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { isAdmin } = useAdmin();

  return (
    <aside className="bg-white dark:bg-background w-64 min-h-screen border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto hidden md:block">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge 
                    className={cn(
                      "text-xs",
                      isActive 
                        ? "bg-white text-primary" 
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </span>
            </Link>
          );
        })}
        
        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Administration
            </p>
            <Link href="/admin">
              <span
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                  location === "/admin"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Shield className="w-5 h-5" />
                <span>Dashboard</span>
                <Badge variant="destructive" className="text-xs">
                  ADMIN
                </Badge>
              </span>
            </Link>
            
            {/* AI Configuration */}
            <Link href="/admin/ai-config">
              <span
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                  location === "/admin/ai-config"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Bot className="w-5 h-5" />
                <span>AI Configuration</span>
              </span>
            </Link>

            {/* Blog Admin Navigation */}
            <div className="ml-4 mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
                Blog
              </p>
              <Link href="/admin/blog-posts">
                <span
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                    location === "/admin/blog-posts"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Articles</span>
                </span>
              </Link>
              <Link href="/admin/blog-categories">
                <span
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                    location === "/admin/blog-categories"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Folder className="w-4 h-4" />
                  <span>Categories</span>
                </span>
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Account
          </p>
          {accountNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
