import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, HelpCircle, Workflow, Webhook, ArrowRightLeft, Filter, GitBranch, Trash2, PlusCircle, Code, Bot, SendToBack } from 'lucide-react';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
import { NODE_MANIFEST } from './custom/node-manifest';
import type { Condition } from '@shared/types';
const selector = (state: RFState) => ({
  selectedNodeId: state.selectedNodeId,
  nodes: state.nodes,
  workflow: state.workflow,
  updateNodeData: state.updateNodeData,
});
export function InspectorPane() {
  const { selectedNodeId, nodes, workflow, updateNodeData } = useStore(selector, shallow);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const handleDataChange = (key: string, value: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, { [key]: value });
    }
  };
  const renderNodeSpecificFields = () => {
    if (!selectedNode) return null;
    const nodeType = String(selectedNode.data.label).replace(/ \d+$/, '');
    switch (nodeType) {
      case 'Webhook':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhook Details</h3>
            <Label htmlFor="webhook-url">Test URL</Label>
            <Input id="webhook-url" value={`https://.../test/${workflow?.id}`} readOnly />
            <p className="text-xs text-slate-500 mt-1">Use this URL to send test data to your workflow.</p>
          </div>
        );
      case 'HTTP Request':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> HTTP Request Details</h3>
            <div>
              <Label htmlFor="http-method">Method</Label>
              <Input id="http-method" value={selectedNode.data.method ?? 'GET'} onChange={(e) => handleDataChange('method', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="http-url">URL</Label>
              <Input id="http-url" placeholder="https://api.example.com" value={selectedNode.data.url ?? ''} onChange={(e) => handleDataChange('url', e.target.value)} />
            </div>
          </div>
        );
      case 'Transform':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Filter className="h-4 w-4" /> Transform Data</h3>
            <div>
              <Label htmlFor="transform-expression">Expression</Label>
              <Textarea
                id="transform-expression"
                placeholder={`{\n  "new_field": data.body.old_field\n}`}
                value={selectedNode.data.expression ?? ''}
                onChange={(e) => handleDataChange('expression', e.target.value)}
                className="font-mono h-48"
              />
              <p className="text-xs text-slate-500 mt-1">Use `data` to reference the input. E.g., `data.body.name`</p>
            </div>
          </div>
        );
      case 'Condition': {
        const conditions: Condition[] = selectedNode.data.conditions ?? [];
        const updateCondition = (index: number, field: keyof Condition, value: string) => {
          const newConditions = [...conditions];
          newConditions[index] = { ...newConditions[index], [field]: value };
          handleDataChange('conditions', newConditions);
        };
        const addCondition = () => {
          const newCondition: Condition = { id: crypto.randomUUID(), variable: '', operator: '===', value: '' };
          handleDataChange('conditions', [...conditions, newCondition]);
        };
        const removeCondition = (index: number) => {
          const newConditions = conditions.filter((_, i) => i !== index);
          handleDataChange('conditions', newConditions);
        };
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4" /> Conditions</h3>
            {conditions.map((cond, index) => (
              <div key={cond.id} className="p-2 border rounded-md space-y-2 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Input placeholder="{{Webhook.body.status}}" value={cond.variable} onChange={e => updateCondition(index, 'variable', e.target.value)} className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={cond.operator} onValueChange={val => updateCondition(index, 'operator', val as Condition['operator'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="===">Equals</SelectItem>
                      <SelectItem value="!==">Not Equals</SelectItem>
                      <SelectItem value=">">Greater Than</SelectItem>
                      <SelectItem value="<">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="completed" value={cond.value} onChange={e => updateCondition(index, 'value', e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCondition}><PlusCircle className="h-4 w-4 mr-2" /> Add Condition</Button>
          </div>
        );
      }
      case 'Code':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Code className="h-4 w-4" /> Custom Code</h3>
            <div>
              <Label htmlFor="code-script">JavaScript Code</Label>
              <Textarea
                id="code-script"
                placeholder={`// Access input data with 'data'\nreturn { result: data.value * 2 };`}
                value={selectedNode.data.code ?? ''}
                onChange={(e) => handleDataChange('code', e.target.value)}
                className="font-mono h-48"
              />
              <p className="text-xs text-slate-500 mt-1">The return value will be the output of this node.</p>
            </div>
          </div>
        );
      case 'AI Call':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4" /> AI Call</h3>
            <div>
              <Label htmlFor="ai-prompt">Prompt</Label>
              <Textarea
                id="ai-prompt"
                placeholder={`Summarize the following text: {{data.some_text}}`}
                value={selectedNode.data.prompt ?? ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                className="h-48"
              />
              <p className="text-xs text-slate-500 mt-1">Use handlebars syntax `{'{{...}}'}` to reference previous data.</p>
            </div>
          </div>
        );
      case 'Respond to Webhook':
        return (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><SendToBack className="h-4 w-4" /> Response Details</h3>
            <div>
              <Label htmlFor="response-status">Status Code</Label>
              <Input id="response-status" type="number" value={selectedNode.data.statusCode ?? 200} onChange={(e) => handleDataChange('statusCode', parseInt(e.target.value, 10))} />
            </div>
            <div>
              <Label htmlFor="response-body">Response Body</Label>
              <Textarea
                id="response-body"
                placeholder={`{{data}}`}
                value={selectedNode.data.body ?? ''}
                onChange={(e) => handleDataChange('body', e.target.value)}
                className="font-mono h-48"
              />
              <p className="text-xs text-slate-500 mt-1">Use handlebars to reference data from previous nodes.</p>
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-slate-500 pt-4 border-t">No specific configuration for this node type yet.</p>;
    }
  };
  const renderNodeInspector = () => {
    if (!selectedNode) return null;
    const nodeInfo = NODE_MANIFEST[String(selectedNode.data.label).replace(/ \d+$/, '')];
    return (
      <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            {nodeInfo && <div className={nodeInfo.color}>{nodeInfo.icon}</div>}
            <CardTitle className="text-lg font-sans font-semibold">{selectedNode.data.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input id="node-label" value={selectedNode.data.label} onChange={(e) => handleDataChange('label', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="node-id">Node ID</Label>
            <Input id="node-id" value={selectedNode.id} readOnly disabled />
          </div>
          {renderNodeSpecificFields()}
        </CardContent>
      </Card>
    );
  };
  const renderWorkflowInspector = () => {
    if (!workflow) return null;
    return (
      <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-sans font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workflow-title">Title</Label>
            <Input id="workflow-title" defaultValue={workflow.title} />
          </div>
          <div>
            <Label htmlFor="workflow-id">Workflow ID</Label>
            <Input id="workflow-id" value={workflow.id} readOnly disabled />
          </div>
        </CardContent>
      </Card>
    );
  };
  return (
    <aside className="w-96 bg-off-white dark:bg-slate-dark/50 border-l border-slate-200 dark:border-slate-700 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display text-slate-dark dark:text-off-white">Inspector</h2>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {selectedNode ? renderNodeInspector() : renderWorkflowInspector()}
        {!selectedNode && !workflow && (
          <div className="text-center text-slate-500 dark:text-slate-400 p-8">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a node to see its properties.</p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}