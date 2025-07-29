import { ReactNode, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMobileMenuOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header onMenuClick={handleMenuClick} />
      <div className="flex">
        <Sidebar />
        <MobileSidebar 
          open={mobileMenuOpen} 
          onOpenChange={setMobileMenuOpen}
        />
        <main className="flex-1 min-w-0 p-4 md:p-6 pt-16 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}