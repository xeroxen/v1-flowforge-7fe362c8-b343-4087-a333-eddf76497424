import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2, XCircle, CircleDashed, Clock, Zap } from 'lucide-react';
import type { Execution, ExecutionStep } from '@shared/types';
import { Toaster, toast } from 'sonner';
export function ExecutionsPage() {
  const { id: workflowId } = useParams<{ id: string }>();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchExecutions = async () => {
      if (!workflowId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/workflows/${workflowId}/executions`);
        if (!response.ok) throw new Error('Failed to fetch executions');
        const { data } = await response.json();
        setExecutions(data);
        if (data.length > 0) {
          setSelectedExecution(data[0]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Could not load execution history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExecutions();
  }, [workflowId]);
  const getStatusBadge = (status: Execution['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  const renderTimeline = () => {
    if (!selectedExecution) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
          <Zap className="h-12 w-12 mb-4 opacity-50" />
          <p>Select an execution to see its details.</p>
        </div>
      );
    }
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <p className="text-sm text-slate-500">ID: {selectedExecution.id}</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2">
            <div className="space-y-2">
              {(selectedExecution.steps || []).map((step, index) => (
                <div key={index} className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-medium">
                      {step.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{step.nodeLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{step.durationMs}ms</span>
                    </div>
                  </div>
                  {step.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1 pl-6">{step.error}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };
  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      </TableRow>
    ))
  );
  return (
    <div className="min-h-screen bg-off-white dark:bg-slate-900 text-slate-dark dark:text-off-white">
      <Toaster richColors />
      <header className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-4xl font-display text-coral-red">Executions</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-150px)]">
        <div className="lg:col-span-2 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      renderSkeletons()
                    ) : executions.length > 0 ? (
                      executions.map((exec) => (
                        <TableRow key={exec.id} onClick={() => setSelectedExecution(exec)} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                          <TableCell>{getStatusBadge(exec.status)}</TableCell>
                          <TableCell className="font-mono text-xs">{exec.id.split('-')[0]}</TableCell>
                          <TableCell>{new Date(exec.startedAt).toLocaleString()}</TableCell>
                          <TableCell>{exec.finishedAt ? `${exec.finishedAt - exec.startedAt}ms` : <CircleDashed className="animate-spin" />}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="text-center">No executions found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 h-full">
          {renderTimeline()}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}