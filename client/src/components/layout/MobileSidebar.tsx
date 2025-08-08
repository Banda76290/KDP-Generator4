import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, X, ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('mobile-sidebar-expanded-groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-expand groups that contain the current active page on initial load
  useEffect(() => {
    const activeGroup = navigation.find(item => 
      item.children?.some(child => location === child.href)
    );
    
    // Only auto-expand if we're on initial load or if the group was never manually collapsed
    const hasBeenManuallyClosed = localStorage.getItem(`mobile-sidebar-group-${activeGroup?.name}-closed`) === 'true';
    
    if (activeGroup && !expandedGroups.includes(activeGroup.name) && !hasBeenManuallyClosed) {
      const newExpanded = [...expandedGroups, activeGroup.name];
      setExpandedGroups(newExpanded);
      localStorage.setItem('mobile-sidebar-expanded-groups', JSON.stringify(newExpanded));
    }
  }, [location]);

  // Persist expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem('mobile-sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const toggleGroup = (groupName: string) => {
    const isCurrentlyExpanded = expandedGroups.includes(groupName);
    const newExpanded = isCurrentlyExpanded 
      ? expandedGroups.filter(name => name !== groupName)
      : [...expandedGroups, groupName];
    
    setExpandedGroups(newExpanded);
    localStorage.setItem('mobile-sidebar-expanded-groups', JSON.stringify(newExpanded));
    
    // Remember if user manually closed a group to prevent auto-expansion
    if (isCurrentlyExpanded) {
      localStorage.setItem(`mobile-sidebar-group-${groupName}-closed`, 'true');
    } else {
      localStorage.removeItem(`mobile-sidebar-group-${groupName}-closed`);
    }
  };

  const renderNavigationItem = (item: any) => {
    if (item.children) {
      // Group with sub-items
      const isExpanded = expandedGroups.includes(item.name);
      const hasActiveChild = item.children.some((child: any) => location === child.href);
      
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleGroup(item.name)}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left",
              hasActiveChild
                ? "text-white"
                : "text-foreground hover:bg-muted"
            )}
            style={hasActiveChild ? { backgroundColor: '#38b6ff' } : {}}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children.map((child: any) => {
                const isChildActive = location === child.href;
                return (
                  <Link key={child.name} href={child.href!}>
                    <span
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-sm",
                        isChildActive
                          ? "text-white"
                          : "text-foreground hover:bg-muted"
                      )}
                      style={isChildActive ? { backgroundColor: '#38b6ff' } : {}}
                      onClick={handleLinkClick}
                    >
                      <child.icon className="w-4 h-4" />
                      <span>{child.name}</span>
                      {child.badge && (
                        <Badge 
                          className={cn(
                            "text-xs",
                            isChildActive 
                              ? "bg-white text-primary" 
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {child.badge}
                        </Badge>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Regular item
      const isActive = location === item.href;
      return (
        <Link key={item.name} href={item.href!}>
          <span
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
              isActive
                ? "text-white"
                : "text-foreground hover:bg-muted"
            )}
            style={isActive ? { backgroundColor: '#38b6ff' } : {}}
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
    }
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
          {navigation.map(renderNavigationItem)}
          
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
                    <Link key={item.name} href={item.href!}>
                      <span
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                          isActive
                            ? "text-white"
                            : "text-foreground hover:bg-muted"
                        )}
                        style={isActive ? { backgroundColor: '#38b6ff' } : {}}
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
                      <Link key={item.name} href={item.href!}>
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
                  <Link key={item.name} href={item.href!}>
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