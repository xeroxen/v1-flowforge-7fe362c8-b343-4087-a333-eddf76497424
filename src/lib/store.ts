import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { immer } from 'zustand/middleware/immer';
import type { Workflow, ExecutionResult, ExecutionStep } from '@shared/types';
export type RunState = 'idle' | 'running' | 'success' | 'error';
export type RFState = {
  workflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  runState: RunState;
  testRequest: {
    method: string;
    headers: string;
    body: string;
  };
  runResult: ExecutionResult | null;
  executionSteps: ExecutionStep[];
  setWorkflow: (workflow: Workflow) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  setTestRequest: (request: Partial<RFState['testRequest']>) => void;
  runWorkflow: () => Promise<void>;
  updateWorkflowStatus: (status: 'draft' | 'published') => Promise<void>;
};
const useStore = create(
  immer<RFState>((set, get) => ({
    workflow: null,
    nodes: [],
    edges: [],
    selectedNodeId: null,
    runState: 'idle',
    testRequest: {
      method: 'POST',
      headers: '{\n  "Content-Type": "application/json"\n}',
      body: '{\n  "message": "Hello from FlowForge!"\n}',
    },
    runResult: null,
    executionSteps: [],
    setWorkflow: (workflow) => {
      set((state: RFState) => {
        state.workflow = workflow;
        state.nodes = workflow.nodes || [];
        state.edges = workflow.edges || [];
        state.selectedNodeId = null;
        state.runState = 'idle';
        state.executionSteps = [];
      });
    },
    onNodesChange: (changes: NodeChange[]) => {
      set((state: RFState) => {
        state.nodes = applyNodeChanges(changes, state.nodes);
      });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      set((state: RFState) => {
        state.edges = applyEdgeChanges(changes, state.edges);
      });
    },
    onConnect: (connection: Connection) => {
      set((state: RFState) => {
        state.edges = addEdge({ ...connection, animated: true, style: { stroke: '#F56565' } }, state.edges);
      });
    },
    addNode: (node: Node) => {
      set((state: RFState) => {
        state.nodes.push(node);
      });
    },
    setSelectedNodeId: (nodeId: string | null) => {
      set({ selectedNodeId: nodeId });
    },
    updateNodeData: (nodeId: string, data: any) => {
      set((state: RFState) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = { ...node.data, ...data };
        }
      });
    },
    setTestRequest: (request) => {
      set((state: RFState) => {
        state.testRequest = { ...state.testRequest, ...request };
      });
    },
    runWorkflow: async () => {
      const { workflow, testRequest } = get();
      if (!workflow) return;
      set({ runState: 'running', runResult: null, executionSteps: [] });
      try {
        const headers = JSON.parse(testRequest.headers || '{}');
        const body = JSON.parse(testRequest.body || '{}');
        const response = await fetch(`/api/workflows/${workflow.id}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: testRequest.method,
            headers,
            body,
          }),
        });
        if (!response.ok) throw new Error('Execution failed');
        const result = await response.json();
        set({
          runState: result.data.status === 'completed' ? 'success' : 'error',
          runResult: result.data.result,
          executionSteps: result.data.steps || [],
        });
      } catch (error) {
        console.error(error);
        set({ runState: 'error', runResult: {
          statusCode: 500,
          headers: {},
          body: { error: error instanceof Error ? error.message : 'An unknown error occurred.' }
        }});
      }
    },
    updateWorkflowStatus: async (status) => {
      const { workflow } = get();
      if (!workflow) return;
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      set((state: RFState) => {
        if (state.workflow) {
          state.workflow.status = status;
        }
      });
    }
  }))
);
export default useStore;