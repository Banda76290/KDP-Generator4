import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Settings, LogOut, Crown } from "lucide-react";
import logoImage from "@assets/image_1753719885932.png";

export default function Header() {
  const { user } = useAuth();

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-background border-b border-border fixed top-0 left-0 right-0 z-50 h-16">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="KDP Generator" 
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="relative p-2 text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-muted">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profileImageUrl} alt="User Avatar" />
                  <AvatarFallback>{getUserInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Crown className="w-4 h-4 mr-2" />
                Subscription
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
