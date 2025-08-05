import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FolderOpen, 
  TrendingUp, 
  Upload, 
  Download,
  Bot, 
  FileText,
  Zap,
  Tags,
  User,
  DollarSign
} from "lucide-react";

export default function SimpleSidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Books", href: "/books", icon: FileText },
    { name: "Authors", href: "/authors", icon: User },
    { name: "Series", href: "/manage-series", icon: Tags },
    { name: "Sales Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Exchange Rates", href: "/exchange-rates", icon: DollarSign },
    { name: "KDP Reports", href: "/kdp-reports", icon: Upload },
    { name: "Import Management", href: "/import-management", icon: Download, badge: "NEW" },
    { name: "AI Assistant", href: "/ai-assistant", icon: Bot, badge: "PRO" },
    { name: "AI Functions", href: "/ai-functions", icon: Zap, badge: "NEW" },
  ];

  return (
    <aside className="bg-white dark:bg-background w-64 border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto hidden md:block">
      <nav className="p-4 space-y-2 pb-8">
        {navItems.map((item: any) => {
          const isActive = location === item.href;
          const IconComponent = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                  isActive
                    ? "text-white"
                    : "text-foreground hover:bg-muted"
                )}
                style={isActive ? { backgroundColor: '#38b6ff' } : {}}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}