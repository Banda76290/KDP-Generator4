import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import logoImage from "@assets/image_1753719885932.png";
import { ChevronDown, ChevronRight } from "lucide-react";
import { 
  navigation, 
  accountNavigation, 
  adminNavigation, 
  blogAdminNavigation 
} from "@/config/navigation";

export default function Sidebar() {
  const [location] = useLocation();
  const { isAdmin } = useAdmin();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-expanded-groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-expand groups that contain the current active page and persist state
  useEffect(() => {
    const activeGroup = navigation.find(item => 
      item.children?.some(child => location === child.href)
    );
    
    if (activeGroup && !expandedGroups.includes(activeGroup.name)) {
      const newExpanded = [...expandedGroups, activeGroup.name];
      setExpandedGroups(newExpanded);
      localStorage.setItem('sidebar-expanded-groups', JSON.stringify(newExpanded));
    }
  }, [location, expandedGroups]);

  // Persist expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
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
    <aside className="bg-white dark:bg-background w-64 border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto hidden md:block">
      <nav className="p-4 space-y-2 pb-8">
        {navigation.map(renderNavigationItem)}
        
        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Administration
            </p>
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
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badge === "ADMIN" ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                </Link>
              );
            })}

            {/* Blog Admin Navigation */}
            <div className="ml-4 mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
                Blog
              </p>
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
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border mt-4 pb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Account
          </p>
          {accountNavigation.map((item) => {
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
