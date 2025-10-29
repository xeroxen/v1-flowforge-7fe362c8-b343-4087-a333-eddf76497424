import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EditorHeader } from '@/components/editor/Header';
import { NodePalette } from '@/components/editor/NodePalette';
import { CanvasPane } from '@/components/editor/CanvasPane';
import { InspectorPane } from '@/components/editor/InspectorPane';
import { RunConsoleDrawer } from '@/components/editor/RunConsoleDrawer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoModal } from '@/components/InfoModal';
import useStore, { RFState } from '@/lib/store';
import type { Workflow } from '@shared/types';
import { Toaster, toast } from 'sonner';
const setWorkflowSelector = (state: RFState) => state.setWorkflow;
export function HomePage() {
  const { id: workflowId } = useParams<{ id: string }>();
  const setWorkflow = useStore(setWorkflowSelector);
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenInfoModal');
    if (!hasSeenModal) {
      setIsInfoModalOpen(true);
      localStorage.setItem('hasSeenInfoModal', 'true');
    }
  }, []);
  useEffect(() => {
    if (!workflowId) return;
    const fetchWorkflow = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (!response.ok) {
          throw new Error('Workflow not found');
        }
        const { data } = await response.json();
        const workflowData: Workflow = {
            ...data,
            nodes: data.nodes || [],
            edges: data.edges || [],
        };
        setWorkflow(workflowData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load workflow.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkflow();
  }, [workflowId, setWorkflow]);
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-off-white dark:bg-slate-900">
        <p className="text-2xl font-display animate-pulse">Loading FlowForge...</p>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="h-screen w-screen flex flex-col bg-off-white dark:bg-slate-900 font-sans">
        <Toaster richColors />
        <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        <EditorHeader />
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={65}>
            <div className="flex h-full">
              <NodePalette />
              <CanvasPane />
              <InspectorPane />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={10} maxSize={70}>
            <div className="bg-off-white dark:bg-slate-dark/50 h-full">
              <RunConsoleDrawer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}