import { Webhook, Code, GitBranch, ArrowRightLeft, Filter, Bot, SendToBack } from 'lucide-react';
import React from 'react';
export interface NodeManifest {
  type: string;
  name: string;
  icon: React.ReactElement;
  color: string;
  description: string;
  initialData: {
    [key: string]: any;
  };
}
export const NODE_MANIFEST: Record<string, NodeManifest> = {
  Webhook: {
    type: 'customInput',
    name: 'Webhook',
    icon: React.createElement(Webhook, { className: "h-6 w-6" }),
    color: 'text-coral-red',
    description: 'Triggers the workflow when an HTTP request is received.',
    initialData: { label: 'Webhook' },
  },
  HttpRequest: {
    type: 'custom',
    name: 'HTTP Request',
    icon: React.createElement(ArrowRightLeft, { className: "h-6 w-6" }),
    color: 'text-blue-500',
    description: 'Sends an HTTP request to a specified URL.',
    initialData: { label: 'HTTP Request', method: 'GET', url: '' },
  },
  Transform: {
    type: 'custom',
    name: 'Transform',
    icon: React.createElement(Filter, { className: "h-6 w-6" }),
    color: 'text-purple-500',
    description: 'Modifies data using expressions or mapping.',
    initialData: { label: 'Transform', expression: '' },
  },
  Condition: {
    type: 'custom',
    name: 'Condition',
    icon: React.createElement(GitBranch, { className: "h-6 w-6" }),
    color: 'text-green-500',
    description: 'Routes data based on conditional logic.',
    initialData: { label: 'Condition', conditions: [] },
  },
  Code: {
    type: 'custom',
    name: 'Code',
    icon: React.createElement(Code, { className: "h-6 w-6" }),
    color: 'text-yellow-500',
    description: 'Executes custom JavaScript code.',
    initialData: { label: 'Code', code: 'return {};' },
  },
  AICall: {
    type: 'custom',
    name: 'AI Call',
    icon: React.createElement(Bot, { className: "h-6 w-6" }),
    color: 'text-indigo-500',
    description: 'Interacts with an AI model.',
    initialData: { label: 'AI Call', prompt: '' },
  },
  RespondtoWebhook: {
    type: 'custom',
    name: 'Respond to Webhook',
    icon: React.createElement(SendToBack, { className: "h-6 w-6" }),
    color: 'text-pink-500',
    description: 'Sends a final response to the initial webhook trigger.',
    initialData: { label: 'Respond to Webhook', statusCode: 200, body: '{{data}}' },
  },
};