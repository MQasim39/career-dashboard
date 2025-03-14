
import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
      <SonnerToaster />
    </div>
  );
};

export default MainLayout;
