import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
export interface Condition {
  id: string;
  variable: string;
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=';
  value: string;
}
export interface NodeData {
  label: string;
  // HTTP Request
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
  // Transform
  expression?: string;
  // Condition
  conditions?: Condition[];
  // Code
  code?: string;
  // AI Call
  prompt?: string;
  // Respond to Webhook
  statusCode?: number;
  body?: string;
  // Allow other properties for extensibility
  [key: string]: any;
}
export type Node = ReactFlowNode<NodeData>;
export type Edge = ReactFlowEdge;
export interface Workflow {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  status: 'published' | 'draft';
  createdAt: number;
  updatedAt: number;
}
export interface WorkflowMetadata {
  id: string;
  title: string;
  status: 'published' | 'draft';
  createdAt: number;
  updatedAt: number;
}
export interface ExecutionTrigger {
  method: string;
  headers: Record<string, string>;
  body: any;
}
export interface ExecutionResult {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}
export interface ExecutionStep {
  nodeId: string;
  nodeLabel: string;
  status: 'success' | 'error';
  durationMs: number;
  input: any;
  output: any;
  error?: string;
}
export interface Execution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  trigger: ExecutionTrigger;
  result?: ExecutionResult;
  steps?: ExecutionStep[];
  startedAt: number;
  finishedAt?: number;
}
export interface Credential {
    id: string;
    name: string;
    type: 'api_key' | 'oauth2';
    value: string; // This will be encrypted
    createdAt: number;
}
export type CredentialMetadata = Omit<Credential, 'value'>;