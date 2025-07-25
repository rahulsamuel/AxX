
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  Building2,
  LayoutDashboard,
  Users,
  User,
  Settings,
  LogOut,
  Presentation,
  BookOpen,
  BarChartHorizontalBig,
  Menu,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initializeDatabase } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/timeline", icon: BarChartHorizontalBig, label: "Timeline" },
  { href: "/events", icon: Presentation, label: "Events" },
  { href: "/projects", icon: Briefcase, label: "Projects" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/clients", icon: Building2, label: "Clients" },
  { href: "/training", icon: BookOpen, label: "Training & PTO" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      initializeDatabase();
    }
  }, [user]);

  if (loading) {
      return (
          <div className="flex min-h-screen w-full flex-col bg-muted/40">
              <header className="sticky top-0 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 z-50">
                <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center gap-x-5">
                    <div className="hidden md:flex md:items-center md:gap-5">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 md:hidden" />
                    </div>
                </div>
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                  <Skeleton className="h-full w-full" />
              </main>
          </div>
      );
  }

  if (!user) {
    return null;
  }

  const getAvatarFallback = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("");
    }
    if (user?.email) {
        return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 z-50">
        <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
            <div className="p-1.5 rounded-lg bg-primary">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    <path d="M4 21.3333V4H15.3333V8.66667H8.66667V10.6667H15.3333V16.6667H8.66667V18.6667H15.3333V21.3333H4Z" fill="white"/>
                    <path d="M16.6667 14H20V4H16.6667V14Z" fill="#FF9800"/>
                </svg>
            </div>
            <span className="font-bold">EventFlow</span>
        </Link>
        
        <div className="flex items-center gap-x-5">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            {navItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "transition-colors hover:text-foreground",
                    pathname.startsWith(item.href) ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
                >
                {item.label}
                </Link>
            ))}
            </nav>
            
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.photoURL || ""} alt="User" data-ai-hint="person avatar" />
                                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.photoURL || ""} alt="User" data-ai-hint="person avatar" />
                                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-sm font-medium leading-none">{user.displayName || 'Admin User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link href="/profile" passHref>
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/settings" passHref>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={signOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Sheet>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold"
                    >
                        <div className="p-1.5 rounded-lg bg-primary">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                >
                                <path d="M4 21.3333V4H15.3333V8.66667H8.66667V10.6667H15.3333V16.6667H8.66667V18.6667H15.3333V21.3333H4Z" fill="white"/>
                                <path d="M16.6667 14H20V4H16.6667V14Z" fill="#FF9800"/>
                            </svg>
                        </div>
                        <span className="font-bold">EventFlow</span>
                    </Link>
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "hover:text-foreground",
                            pathname.startsWith(item.href) ? "text-foreground" : "text-muted-foreground"
                        )}
                        >
                        {item.label}
                        </Link>
                    ))}
                    </nav>
                </SheetContent>
                </Sheet>
            </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
    </div>
  );
}
