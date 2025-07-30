import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdmin } from "@/hooks/useAdmin";
import logoImage from "@assets/image_1753719885932.png";
import { 
  navigation, 
  accountNavigation, 
  adminNavigation, 
  blogAdminNavigation 
} from "@/config/navigation";

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
        
        <div className="flex-1 overflow-y-auto h-full max-h-[calc(100vh-120px)]">
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
                {adminNavigation.map((item) => {
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
                                : item.badge === "ADMIN" 
                                  ? "bg-red-500 text-white"
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

                {/* Blog Admin Section */}
                <div className="ml-3 mt-3 space-y-1">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>BLOG</span>
                  </div>
                  
                  {blogAdminNavigation.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.name} href={item.href}>
                        <span
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                          onClick={handleLinkClick}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
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