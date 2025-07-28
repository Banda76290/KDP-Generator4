import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FolderOpen, 
  TrendingUp, 
  Upload, 
  Bot, 
  Crown, 
  Settings 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <aside className="bg-white dark:bg-background w-64 min-h-screen border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <img 
          src={logoImage} 
          alt="KDP Generator" 
          className="h-8 w-auto object-contain"
        />
      </div>
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
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
              </a>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Account
          </p>
          {accountNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
