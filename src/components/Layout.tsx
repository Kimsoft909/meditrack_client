// Main app layout with sidebar navigation and top header

import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProfileModal } from '@/components/ProfileModal';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Pill, 
  Settings, 
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/ai-analysis', label: 'AI Analysis', icon: FileText },
  { path: '/drug-checker', label: 'Drug Checker', icon: Pill },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const SIDEBAR_STATE_KEY = 'meditrack-sidebar-state';

export const Layout = () => {
  const location = useLocation();
  
  // Initialize sidebar state from localStorage, default to closed
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Floating Sidebar */}
      <aside 
        className={`
          fixed z-50 transition-all duration-300 ease-in-out
          bg-card border border-border/40
          shadow-2xl shadow-primary/5 floating-sidebar
          
          lg:left-4 lg:top-4 lg:bottom-4 lg:rounded-2xl
          ${sidebarOpen ? 'lg:w-60' : 'lg:w-14'}
          
          max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:w-72 max-lg:rounded-none max-lg:border-r
          ${sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 rounded-t-2xl max-lg:rounded-none bg-gradient-to-b from-primary/5 to-transparent">
          {sidebarOpen && (
            <div className="flex items-center gap-2 transition-opacity duration-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-base text-foreground">MEDITRACK</span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:scale-110 transition-transform duration-200"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{sidebarOpen ? 'Close sidebar' : 'Open sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg relative
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] nav-item-glow' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:backdrop-blur-sm hover:translate-x-1 hover:text-accent-foreground'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
              >
                <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                {sidebarOpen && (
                  <span className="text-sm font-medium transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary-foreground rounded-r" />
                )}
              </Link>
            );

            // Show tooltip only when sidebar is collapsed
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-3 left-3 right-3">
          {!sidebarOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/40 hover:shadow-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/40 hover:shadow-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0 text-destructive" />
              <span className="text-sm text-destructive">Logout</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-[272px]' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-30">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Welcome back, Dr. Smith</h2>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  3
                </Badge>
              </Button>

              {/* Profile */}
              <Popover open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-border hover:bg-accent/50 rounded-lg transition-colors p-1.5 -m-1.5">
                    <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-xs font-semibold">
                        DS
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium">Dr. Sarah Smith</p>
                      <p className="text-[10px] text-muted-foreground">Cardiologist</p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto p-0 shadow-xl border-primary/20"
                >
                  <ProfileModal onClose={() => setProfileModalOpen(false)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
