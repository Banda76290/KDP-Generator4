import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, FolderOpen, FileText, Users, BarChart3, Settings, Upload } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Books", href: "/books", icon: FileText },
  { name: "Authors", href: "/authors", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Import Management", href: "/import-management", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings }
];

export default function SimpleLayout({ children }: LayoutProps) {
  const [location] = useLocation() as [string];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
        <h1 className="text-xl font-bold text-blue-600">KDP Generator</h1>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item: any) => {
              const isActive = location === item.href;
              const IconComponent = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}