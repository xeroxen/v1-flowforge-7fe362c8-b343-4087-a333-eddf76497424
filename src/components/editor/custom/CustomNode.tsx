import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { NODE_MANIFEST } from './node-manifest';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
import { cn } from '@/lib/utils';
const selector = (state: RFState) => ({
  executionSteps: state.executionSteps,
  runState: state.runState,
});
export function CustomNode({ data, type, isConnectable, id }: NodeProps) {
  const { executionSteps, runState } = useStore(selector, shallow);
  const step = executionSteps.find(s => s.nodeId === id);
  const nodeStatus = runState === 'running' || runState === 'idle' ? 'idle' : step?.status || 'idle';
  const label = String(data.label || '');
  const nodeInfo = Object.values(NODE_MANIFEST).find(
    (node) => node.name === label.replace(/ \d+$/, '') || node.name === label
  );
  const isInputNode = type === 'customInput';
  const isConditionNode = nodeInfo?.name === 'Condition';
  const iconElement = nodeInfo && React.isValidElement(nodeInfo.icon)
    ? React.cloneElement(nodeInfo.icon as React.ReactElement, { className: `h-6 w-6 ${nodeInfo.color}` })
    : null;
  return (
    <Card className={cn(
      "w-64 border-2 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl",
      nodeStatus === 'success' && 'border-green-500 node-success',
      nodeStatus === 'error' && 'border-red-500 node-error'
    )}>
      <CardHeader className="flex flex-row items-center space-x-4 p-3">
        <div className={`p-2 rounded-md bg-opacity-20 ${nodeInfo?.color.replace('text-', 'bg-')}`}>
          {iconElement}
        </div>
        <CardTitle className="font-sans font-semibold text-base text-slate-dark dark:text-off-white">{label}</CardTitle>
      </CardHeader>
      {!isInputNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-coral-red w-3 h-3"
          isConnectable={isConnectable}
        />
      )}
      {isConditionNode ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!bg-green-500 w-3 h-3"
            style={{ top: '33%' }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!bg-red-500 w-3 h-3"
            style={{ top: '66%' }}
            isConnectable={isConnectable}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-coral-red w-3 h-3"
          isConnectable={isConnectable}
        />
      )}
    </Card>
  );
}