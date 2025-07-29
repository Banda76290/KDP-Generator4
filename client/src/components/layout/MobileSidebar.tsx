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
  Folder,
  Zap,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdmin } from "@/hooks/useAdmin";
import logoImage from "@assets/image_1753719885932.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Books", href: "/books", icon: FileText },
  { name: "Sales Analytics", href: "/analytics", icon: TrendingUp },
  { name: "KDP Reports", href: "/kdp-reports", icon: Upload },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot, badge: "PRO" },
  { name: "AI Functions", href: "/ai-functions", icon: Zap, badge: "NEW" },
];

const accountNavigation = [
  { name: "Subscription", href: "/subscription", icon: Crown },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const [location] = useLocation();
  const { isAdmin } = useAdmin();

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-4 py-6 border-b">
          <SheetTitle className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="KDP Generator" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-semibold">KDP Generator</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
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
                  onClick={handleLinkClick}
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
              <div className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </div>
              
              <div className="space-y-1">
                <Link href="/admin/dashboard">
                  <span
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                      location === "/admin/dashboard"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={handleLinkClick}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </span>
                </Link>
                
                <Link href="/admin/users">
                  <span
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                      location === "/admin/users"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={handleLinkClick}
                  >
                    <Settings className="w-5 h-5" />
                    <span>User Management</span>
                  </span>
                </Link>
                
                <Link href="/admin/config">
                  <span
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                      location === "/admin/config"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={handleLinkClick}
                  >
                    <Zap className="w-5 h-5" />
                    <span>AI Configuration</span>
                  </span>
                </Link>
              </div>
            </div>
          )}
          
          {/* Account Section */}
          <div className="pt-4 border-t border-border mt-4">
            <div className="space-y-1">
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
                      onClick={handleLinkClick}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}