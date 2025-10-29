import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Play, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const selector = (state: RFState) => ({
  workflow: state.workflow,
  nodes: state.nodes,
  edges: state.edges,
  runWorkflow: state.runWorkflow,
  runState: state.runState,
  updateWorkflowStatus: state.updateWorkflowStatus,
});
export function EditorHeader() {
  const { workflow, nodes, edges, runWorkflow, runState, updateWorkflowStatus } = useStore(selector, shallow);
  const handleSave = async () => {
    if (!workflow) return;
    const promise = fetch(`/api/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    });
    toast.promise(promise, {
      loading: 'Saving workflow...',
      success: 'Workflow saved successfully!',
      error: 'Failed to save workflow.',
    });
  };
  const handlePublish = async () => {
    if (!workflow) return;
    const newStatus = workflow.status === 'draft' ? 'published' : 'draft';
    const promise = updateWorkflowStatus(newStatus);
    toast.promise(promise, {
      loading: `${newStatus === 'published' ? 'Publishing' : 'Unpublishing'} workflow...`,
      success: `Workflow ${newStatus}!`,
      error: 'Failed to update workflow status.',
    });
  };
  if (!workflow) {
    return (
      <header className="bg-off-white/80 dark:bg-slate-dark/80 backdrop-blur-sm p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
          <div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mt-1"></div>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="bg-off-white/80 dark:bg-slate-dark/80 backdrop-blur-sm p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5 text-slate-dark dark:text-off-white" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Back to Dashboard</p>
          </TooltipContent>
        </Tooltip>
        <div>
          <h1 className="text-xl font-semibold text-slate-dark dark:text-off-white font-sans">{workflow.title}</h1>
          <Badge variant={workflow.status === 'draft' ? 'secondary' : 'default'} className="capitalize text-xs">
            {workflow.status === 'published' ? (
              <React.Fragment key="published-dot">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {workflow.status}
              </React.Fragment>
            ) : (
              workflow.status
            )}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave} variant="outline" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save current workflow state</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={runWorkflow} disabled={runState === 'running'} variant="outline" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {runState === 'running' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run a test execution</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handlePublish} className="bg-coral-red text-white hover:bg-red-500 transition-colors hover:scale-105 active:scale-95">
              <Share2 className="h-4 w-4 mr-2" />
              {workflow.status === 'draft' ? 'Publish' : 'Unpublish'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{workflow.status === 'draft' ? 'Make this workflow live' : 'Revert to draft'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}