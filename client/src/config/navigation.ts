import { 
  LucideIcon,
  BarChart3, 
  FolderOpen, 
  TrendingUp, 
  Upload, 
  Download,
  Bot, 
  Crown, 
  Settings,
  Shield,
  FileText,
  Zap,
  Variable,
  Tags,
  Server,
  User,
  MessageSquare,
  DollarSign
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const navigation: NavigationItem[] = [
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

export const accountNavigation: NavigationItem[] = [
  { name: "Subscription", href: "/subscription", icon: Crown },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const adminNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/admin", icon: Shield, badge: "ADMIN" },
  { name: "User Management", href: "/admin/users", icon: Settings },
  { name: "AI Configuration", href: "/admin/ai-config", icon: Bot },
  { name: "Prompts IA", href: "/admin/prompts", icon: MessageSquare },
  { name: "Variables IA", href: "/admin/ai-variables", icon: Variable },
  { name: "Cron Jobs", href: "/admin/cron", icon: Bot },
  { name: "Système", href: "/admin/system", icon: Server },
];

export const blogAdminNavigation: NavigationItem[] = [
  { name: "Articles", href: "/admin/blog-posts", icon: FileText },
  { name: "Catégories", href: "/admin/blog-categories", icon: Tags },
];