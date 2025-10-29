import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController } from "./core-utils";
import type { Workflow, ExecutionTrigger, Credential } from '@shared/types';
import { EXAMPLES } from "./examples";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
            const url = new URL(c.req.url);
            url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
            return agent.fetch(new Request(url.toString(), {
                method: c.req.method,
                headers: c.req.header(),
                body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
            }));
        } catch (error) {
            console.error('Agent routing error:', error);
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Workflow Routes
    app.get('/api/workflows', async (c) => {
        const controller = getAppController(c.env);
        const workflows = await controller.listWorkflows();
        return c.json({ success: true, data: workflows });
    });
    app.post('/api/workflows', async (c) => {
        const { title } = await c.req.json<{ title: string }>();
        if (!title) return c.json({ success: false, error: 'Title is required' }, 400);
        const controller = getAppController(c.env);
        const newWorkflowMeta = await controller.createWorkflow(title);
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `workflow-${newWorkflowMeta.id}`);
        const initialWorkflow: Workflow = {
            ...newWorkflowMeta,
            nodes: [],
            edges: [],
            updatedAt: newWorkflowMeta.createdAt,
        };
        await agent.fetch(new Request(`https://agent/update`, {
            method: 'PUT',
            body: JSON.stringify(initialWorkflow),
            headers: { 'Content-Type': 'application/json' }
        }));
        return c.json({ success: true, data: newWorkflowMeta }, 201);
    });
    app.post('/api/workflows/import-example', async (c) => {
        const { exampleId } = await c.req.json<{ exampleId: string }>();
        const example = EXAMPLES[exampleId];
        if (!example) return c.json({ success: false, error: 'Example not found' }, 404);
        const controller = getAppController(c.env);
        const newWorkflowMeta = await controller.createWorkflow(example.title);
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `workflow-${newWorkflowMeta.id}`);
        const workflowData: Workflow = {
            ...newWorkflowMeta,
            ...example.data,
        };
        await agent.fetch(new Request('https://agent/update', {
            method: 'PUT',
            body: JSON.stringify(workflowData),
            headers: { 'Content-Type': 'application/json' }
        }));
        return c.json({ success: true, data: newWorkflowMeta }, 201);
    });
    app.get('/api/workflows/:id', async (c) => {
        const { id } = c.req.param();
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `workflow-${id}`);
        const res = await agent.fetch('https://agent/get');
        if (!res.ok) return c.json({ success: false, error: 'Workflow not found' }, 404);
        const data = await res.json();
        return c.json(data);
    });
    app.put('/api/workflows/:id', async (c) => {
        const { id } = c.req.param();
        const workflowData = await c.req.json<Partial<Workflow>>();
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `workflow-${id}`);
        const res = await agent.fetch(new Request('https://agent/update', {
            method: 'PUT',
            body: JSON.stringify(workflowData),
            headers: { 'Content-Type': 'application/json' }
        }));
        if (workflowData.title || workflowData.status) {
            const controller = getAppController(c.env);
            await controller.updateWorkflowMetadata({
                id,
                title: workflowData.title,
                status: workflowData.status,
            });
        }
        return c.json(await res.json());
    });
    app.post('/api/workflows/:id/run', async (c) => {
        const workflowId = c.req.param('id');
        const trigger = await c.req.json<ExecutionTrigger>();
        const executionId = crypto.randomUUID();
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `execution-${executionId}`);
        const res = await agent.fetch(new Request('https://agent/start', {
            method: 'POST',
            body: JSON.stringify({ trigger, workflowId }),
            headers: { 'Content-Type': 'application/json' }
        }));
        return c.json(await res.json());
    });
    app.get('/api/workflows/:id/executions', async (c) => {
        const workflowId = c.req.param('id');
        const controller = getAppController(c.env);
        const executionIds = await controller.listExecutionsForWorkflow(workflowId);
        const executionPromises = executionIds.map(async (execId) => {
            try {
                const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, `execution-${execId}`);
                const res = await agent.fetch('https://agent/get');
                if (res.ok) {
                    const result: any = await res.json();
                    return result.data;
                }
            } catch (e) {
                console.error(`Failed to fetch execution ${execId}`, e);
            }
            return null;
        });
        const executions = (await Promise.all(executionPromises)).filter(Boolean);
        return c.json({ success: true, data: executions });
    });
    // Credentials Routes
    app.get('/api/credentials', async (c) => {
        const controller = getAppController(c.env);
        const credentials = await controller.listCredentials();
        return c.json({ success: true, data: credentials });
    });
    app.post('/api/credentials', async (c) => {
        const body = await c.req.json<Omit<Credential, 'id' | 'createdAt'>>();
        if (!body.name || !body.value) {
            return c.json({ success: false, error: 'Name and value are required' }, 400);
        }
        const controller = getAppController(c.env);
        const newCredential = await controller.createCredential(body);
        return c.json({ success: true, data: newCredential }, 201);
    });
    app.delete('/api/credentials/:id', async (c) => {
        const { id } = c.req.param();
        const controller = getAppController(c.env);
        const deleted = await controller.deleteCredential(id);
        if (!deleted) return c.json({ success: false, error: 'Credential not found' }, 404);
        return c.json({ success: true });
    });
    // Session Routes (from template)
    app.get('/api/sessions', async (c) => {
        const controller = getAppController(c.env);
        const sessions = await controller.listSessions();
        return c.json({ success: true, data: sessions });
    });
}