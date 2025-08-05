import { ReactNode, useState } from "react";
import Header from "@/components/layout/Header";
import SimpleSidebar from "@/components/layout/SimpleSidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const mobileMenuState = useState<boolean>(false);
  const mobileMenuOpen = mobileMenuState[0];
  const setMobileMenuOpen = mobileMenuState[1];

  const handleMenuClick = () => {
    setMobileMenuOpen(true);
  };

  return (
    <div className="layout-container">
      <Header onMenuClick={handleMenuClick} />
      <div className="layout-content">
        <SimpleSidebar />
        <MobileSidebar 
          open={mobileMenuOpen} 
          onOpenChange={setMobileMenuOpen}
        />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
}