import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function AppHeader() {
  return (
    <header className="p-4 border-b border-slate-200 dark:border-slate-700">
      <TooltipProvider>
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/">
            <h1 className="text-4xl font-display text-coral-red">FlowForge</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage your account</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </header>
  );
}