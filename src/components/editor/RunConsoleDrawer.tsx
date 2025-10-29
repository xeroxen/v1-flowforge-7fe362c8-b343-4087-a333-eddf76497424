import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { RequestComposer } from './run-console/RequestComposer';
import { ResponseViewer } from './run-console/ResponseViewer';
import { ExecutionTimeline } from './run-console/ExecutionTimeline';
import { Play, FileJson, History } from 'lucide-react';
export function RunConsoleDrawer() {
  return (
    <Tabs defaultValue="test-run" className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <TabsList>
          <TabsTrigger value="test-run"><Play className="h-4 w-4 mr-2" />Test Run</TabsTrigger>
          <TabsTrigger value="schema" disabled><FileJson className="h-4 w-4 mr-2" />Schema</TabsTrigger>
          <TabsTrigger value="history" disabled><History className="h-4 w-4 mr-2" />History</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="test-run" className="flex-1 overflow-hidden mt-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={40} minSize={25}>
            <RequestComposer />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ExecutionTimeline />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={25}>
            <ResponseViewer />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabsContent>
    </Tabs>
  );
}