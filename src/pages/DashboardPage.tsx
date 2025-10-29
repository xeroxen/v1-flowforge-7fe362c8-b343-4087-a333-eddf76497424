import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Search, Workflow as WorkflowIcon, History } from 'lucide-react';
import type { WorkflowMetadata } from '@shared/types';
import { Toaster, toast } from 'sonner';
import { ExamplesGallery } from '@/components/dashboard/ExamplesGallery';
import { AppHeader } from '@/components/AppHeader';
export function DashboardPage() {
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (!response.ok) throw new Error('Failed to fetch workflows');
        const { data } = await response.json();
        setWorkflows(data);
      } catch (error) {
        console.error(error);
        toast.error('Could not load your workflows.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkflows();
  }, []);
  const handleCreateWorkflow = async () => {
    const title = 'Untitled Workflow';
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create workflow');
      const { data } = await response.json();
      navigate(`/workflows/${data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Could not create a new workflow.');
    }
  };
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-5 w-1/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  return (
    <div className="min-h-screen bg-off-white dark:bg-slate-900 text-slate-dark dark:text-off-white">
      <Toaster richColors />
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-sans">Your Workflows</h2>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
            <Button onClick={handleCreateWorkflow} className="bg-coral-red text-white hover:bg-red-500 transition-colors hover:scale-105 active:scale-95">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>
        {isLoading ? (
          renderSkeletons()
        ) : workflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workflows.map((flow) => (
              <Card key={flow.id} className="bg-white dark:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">
                <CardHeader>
                  <CardTitle className="font-sans">{flow.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Last updated: {new Date(flow.updatedAt).toLocaleDateString()}
                  </p>
                  <Badge variant={flow.status === 'draft' ? 'secondary' : 'default'} className="capitalize text-xs mt-2">
                    {flow.status}
                  </Badge>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" asChild className="flex-1">
                    <Link to={`/workflows/${flow.id}`}>Open Editor</Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/workflows/${flow.id}/executions`} title="View Executions">
                      <History className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <WorkflowIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Workflows Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Get started by creating your first automation.</p>
            <Button onClick={handleCreateWorkflow} className="bg-coral-red text-white hover:bg-red-500">Create Workflow</Button>
          </div>
        )}
        <ExamplesGallery />
      </main>
      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400">
        Built with ��️ at Cloudflare
      </footer>
    </div>
  );
}