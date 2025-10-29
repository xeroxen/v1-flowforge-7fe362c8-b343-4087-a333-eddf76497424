import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
const selector = (state: RFState) => ({
  executionSteps: state.executionSteps,
  runState: state.runState,
});
export function ExecutionTimeline() {
  const { executionSteps, runState } = useStore(selector, shallow);
  if (runState === 'idle' && executionSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
        <Zap className="h-12 w-12 mb-4 opacity-50" />
        <p>Execution steps will appear here.</p>
      </div>
    );
  }
  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="font-semibold mb-2">Execution Timeline</h3>
      <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-md p-2">
        <div className="space-y-2">
          {executionSteps.map((step, index) => (
            <div key={index} className="p-2 rounded-md bg-white dark:bg-slate-700/50 text-sm">
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
    </div>
  );
}