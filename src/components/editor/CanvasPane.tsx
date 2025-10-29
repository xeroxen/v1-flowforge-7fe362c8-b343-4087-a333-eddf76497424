import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  SelectionMode,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore, { RFState } from '@/lib/store';
import { shallow } from 'zustand/shallow';
import { CustomNode } from './custom/CustomNode';
import { NODE_MANIFEST } from './custom/node-manifest';
const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  setSelectedNodeId: state.setSelectedNodeId,
  executionSteps: state.executionSteps,
  runState: state.runState,
});
export function CanvasPane() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId, executionSteps, runState } = useStore(
    selector,
    shallow
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
    customInput: CustomNode,
  }), []);
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;
      const dataString = event.dataTransfer.getData('application/reactflow');
      if (!dataString) return;
      const { type, name } = JSON.parse(dataString);
      const nodeManifest = NODE_MANIFEST[name];
      if (!nodeManifest) return;
      const position = {
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      };
      const newNode: Node = {
        id: `${name.replace(/\s/g, '')}-${+new Date()}`,
        type: type,
        position,
        data: { ...nodeManifest.initialData, label: name },
      };
      addNode(newNode);
    },
    [addNode]
  );
  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    setSelectedNodeId(nodes.length === 1 ? nodes[0].id : null);
  }, [setSelectedNodeId]);
  const processedEdges = useMemo(() => {
    if (runState === 'idle' || runState === 'running') return edges;
    const executedEdgeIds = new Set<string>();
    for (let i = 0; i < executionSteps.length - 1; i++) {
      const currentStep = executionSteps[i];
      const nextStep = executionSteps[i + 1];
      const edge = edges.find(e => e.source === currentStep.nodeId && e.target === nextStep.nodeId);
      if (edge) {
        executedEdgeIds.add(edge.id);
      }
    }
    return edges.map(edge => {
      if (executedEdgeIds.has(edge.id)) {
        return {
          ...edge,
          animated: true,
          className: 'edge-flow',
          style: { stroke: '#10B981', strokeWidth: 2.5 },
        };
      }
      return edge;
    });
  }, [edges, executionSteps, runState]);
  return (
    <main className="flex-1 bg-gray-100 dark:bg-gray-900 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={processedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-off-white dark:bg-slate-900"
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background gap={16} size={1} color="#ddd" />
      </ReactFlow>
    </main>
  );
}