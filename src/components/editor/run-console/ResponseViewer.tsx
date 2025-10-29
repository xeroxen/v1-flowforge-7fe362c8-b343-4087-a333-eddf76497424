import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, FileJson, CircleDashed, AlertTriangle } from 'lucide-react';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
const selector = (state: RFState) => ({
  runState: state.runState,
  runResult: state.runResult,
});
export function ResponseViewer() {
  const { runState, runResult } = useStore(selector, shallow);
  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 500) return 'bg-red-500';
    if (statusCode >= 400) return 'bg-yellow-500';
    if (statusCode >= 200) return 'bg-green-500';
    return 'bg-slate-500';
  };
  if (runState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <Server className="h-12 w-12 mb-4 opacity-50" />
        <p>Run a test to see the response here.</p>
      </div>
    );
  }
  if (runState === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <CircleDashed className="h-12 w-12 mb-4 animate-spin" />
        <p>Executing workflow...</p>
      </div>
    );
  }
  if (runState === 'error' && !runResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p>An unexpected error occurred during execution.</p>
      </div>
    );
  }
  if (!runResult) return null;
  const formattedBody = typeof runResult.body === 'string' ? runResult.body : JSON.stringify(runResult.body, null, 2);
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-semibold">Response</h3>
        <Badge className={`text-white ${getStatusBadge(runResult.statusCode)}`}>
          {runResult.statusCode}
        </Badge>
      </div>
      <Card className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/50">
        <CardHeader className="p-2 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Body
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            <pre className="text-sm p-2 font-mono">{formattedBody}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}