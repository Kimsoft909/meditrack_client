// Main app layout with sidebar navigation and top header

import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Pill, 
  Settings, 
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bell
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

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 h-full bg-card border-r border-border
          transition-all duration-300 z-40
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
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
                className="h-8 w-8"
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
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
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
        <div className="absolute bottom-4 left-0 right-0 px-3">
          {!sidebarOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm">Logout</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Top Header */}
        <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-30">
          <div className="h-full px-6 flex items-center justify-between">
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
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    DS
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium">Dr. Sarah Smith</p>
                  <p className="text-[10px] text-muted-foreground">Cardiologist</p>
                </div>
              </div>
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
