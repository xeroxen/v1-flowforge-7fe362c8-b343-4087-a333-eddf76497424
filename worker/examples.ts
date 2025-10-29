import type { Workflow } from '@shared/types';
type ExampleData = Omit<Workflow, 'id' | 'title' | 'status' | 'createdAt' | 'updatedAt'>;
export const EXAMPLES: Record<string, { title: string; data: ExampleData }> = {
    'webhook-transform-respond': {
        title: 'Webhook → Transform → Respond',
        data: {
            nodes: [
                { id: 'Webhook-1', type: 'customInput', position: { x: 100, y: 100 }, data: { label: 'Webhook' } },
                { id: 'Transform-2', type: 'custom', position: { x: 400, y: 100 }, data: { label: 'Transform', expression: '{\n  "message": `Hello, ${data.name || "world"}!`,\n  "receivedAt": new Date().toISOString()\n}' } },
            ],
            edges: [
                { id: 'e1-2', source: 'Webhook-1', target: 'Transform-2', animated: true },
            ],
        },
    },
    'webhook-condition-http': {
        title: 'Webhook → Condition → HTTP',
        data: {
            nodes: [
                { id: 'Webhook-1', type: 'customInput', position: { x: 50, y: 200 }, data: { label: 'Webhook' } },
                { id: 'Condition-2', type: 'custom', position: { x: 350, y: 200 }, data: { label: 'Condition', conditions: [{ id: 'cond1', variable: '{{data.type}}', operator: '===', value: 'urgent' }] } },
                { id: 'HTTPRequest-3', type: 'custom', position: { x: 650, y: 100 }, data: { label: 'HTTP Request', method: 'POST', url: 'https://api.example.com/urgent' } },
                { id: 'HTTPRequest-4', type: 'custom', position: { x: 650, y: 300 }, data: { label: 'HTTP Request', method: 'POST', url: 'https://api.example.com/regular' } },
            ],
            edges: [
                { id: 'e1-2', source: 'Webhook-1', target: 'Condition-2', animated: true },
                { id: 'e2-3', source: 'Condition-2', sourceHandle: 'true', target: 'HTTPRequest-3', animated: true, label: 'Urgent' },
                { id: 'e2-4', source: 'Condition-2', sourceHandle: 'false', target: 'HTTPRequest-4', animated: true, label: 'Regular' },
            ],
        },
    },
    'schedule-http-ai': {
        title: 'Schedule → HTTP → AI',
        data: {
            nodes: [
                // Note: Schedule Trigger is not implemented yet, using Webhook as placeholder
                { id: 'Webhook-1', type: 'customInput', position: { x: 100, y: 100 }, data: { label: 'Webhook' } },
                { id: 'HTTPRequest-2', type: 'custom', position: { x: 400, y: 100 }, data: { label: 'HTTP Request', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' } },
                { id: 'AICall-3', type: 'custom', position: { x: 700, y: 100 }, data: { label: 'AI Call', prompt: 'Summarize the following blog post: {{HTTPRequest.body.body}}' } },
            ],
            edges: [
                { id: 'e1-2', source: 'Webhook-1', target: 'HTTPRequest-2', animated: true },
                { id: 'e2-3', source: 'HTTPRequest-2', target: 'AICall-3', animated: true },
            ],
        },
    },
};