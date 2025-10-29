import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2 } from 'lucide-react';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
const selector = (state: RFState) => ({
  testRequest: state.testRequest,
  setTestRequest: state.setTestRequest,
  runWorkflow: state.runWorkflow,
  runState: state.runState,
});
export function RequestComposer() {
  const { testRequest, setTestRequest, runWorkflow, runState } = useStore(selector, shallow);
  const handleRun = () => {
    runWorkflow();
  };
  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-end gap-2">
        <div className="w-32">
          <Label htmlFor="method">Method</Label>
          <Select value={testRequest.method} onValueChange={(value) => setTestRequest({ method: value })}>
            <SelectTrigger id="method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Webhook URL</Label>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-sm truncate">
            /test-trigger
          </div>
        </div>
        <Button onClick={handleRun} disabled={runState === 'running'} className="bg-coral-red text-white hover:bg-red-500">
          {runState === 'running' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Run Test
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col">
          <Label htmlFor="headers">Headers</Label>
          <Textarea
            id="headers"
            placeholder={`{\n  "Content-Type": "application/json"\n}`}
            value={testRequest.headers}
            onChange={(e) => setTestRequest({ headers: e.target.value })}
            className="font-mono flex-1 resize-none"
          />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            placeholder={`{\n  "key": "value"\n}`}
            value={testRequest.body}
            onChange={(e) => setTestRequest({ body: e.target.value })}
            className="font-mono flex-1 resize-none"
          />
        </div>
      </div>
    </div>
  );
}