import { Agent, getAgentByName } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import type { Workflow, Execution, ExecutionTrigger, ExecutionStep, Node, Edge } from '@shared/types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage } from './utils';
import { executeNode } from './execution-engine';
import { getAppController } from './core-utils';
type AgentState = ChatState | Workflow | Execution;
export class ChatAgent extends Agent<Env, AgentState> {
  private chatHandler?: ChatHandler;
  private agentType: 'chat' | 'workflow' | 'execution' = 'chat';
  initialState: AgentState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash'
  };
  async onStart(): Promise<void> {
    if (this.name.startsWith('workflow-')) {
      this.agentType = 'workflow';
    } else if (this.name.startsWith('execution-')) {
      this.agentType = 'execution';
    } else {
      this.agentType = 'chat';
      this.chatHandler = new ChatHandler(
        this.env.CF_AI_BASE_URL,
        this.env.CF_AI_API_KEY,
        (this.state as ChatState).model
      );
    }
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      switch (this.agentType) {
        case 'workflow':
          return this.handleWorkflowRequest(request);
        case 'execution':
          return this.handleExecutionRequest(request);
        case 'chat':
        default:
          return this.handleChatRequest(request);
      }
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async handleWorkflowRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/get') {
      return Response.json({ success: true, data: this.state });
    }
    if (request.method === 'PUT' && url.pathname === '/update') {
      const workflowData = await request.json<Partial<Workflow>>();
      this.setState({ ...(this.state as Workflow), ...workflowData, updatedAt: Date.now() });
      return Response.json({ success: true, data: this.state });
    }
    return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
  }
  private async handleExecutionRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/get') {
        return Response.json({ success: true, data: this.state });
    }
    if (request.method === 'POST' && url.pathname === '/start') {
      const { trigger, workflowId } = await request.json<{ trigger: ExecutionTrigger, workflowId: string }>();
      const executionId = this.name.split('execution-')[1];
      const controller = getAppController(this.env);
      await controller.addExecutionToWorkflow(workflowId, executionId);
      const initialState: Execution = {
        id: executionId,
        workflowId,
        trigger,
        status: 'running',
        startedAt: Date.now(),
        steps: [],
      };
      this.setState(initialState);
      try {
        const workflowAgent = await getAgentByName<Env, ChatAgent>(this.env.CHAT_AGENT, `workflow-${workflowId}`);
        const res = await workflowAgent.fetch('https://agent/get');
        if (!res.ok) throw new Error('Workflow definition not found.');
        const workflowRes = await res.json<{ data: Workflow }>();
        const workflow = workflowRes.data;
        const { nodes, edges } = workflow;
        const triggerNode = nodes.find(n => n.type === 'customInput');
        if (!triggerNode) throw new Error('No trigger node found in workflow.');
        let currentNode: Node | undefined = triggerNode;
        let currentInput: any = trigger.body;
        const steps: ExecutionStep[] = [];
        const executionContext: { [key: string]: any } = {};
        while (currentNode) {
          const startTime = Date.now();
          const stepResult = await executeNode(currentNode, currentInput, executionContext, this.env);
          const durationMs = Date.now() - startTime;
          const fullStep: ExecutionStep = { ...stepResult, durationMs };
          steps.push(fullStep);
          const nodeName = String(currentNode.data.label).replace(/ \d+$/, '');
          executionContext[nodeName] = stepResult.output;
          if (stepResult.status === 'error') {
            throw new Error(`Error at node ${currentNode.data.label}: ${stepResult.error}`);
          }
          currentInput = stepResult.output;
          const nodeType = String(currentNode.data.label).replace(/ \d+$/, '');
          let nextEdge: Edge | undefined;
          if (nodeType === 'Condition') {
            const conditionResult: boolean = stepResult.output.result;
            nextEdge = edges.find(e => e.source === currentNode?.id && e.sourceHandle === String(conditionResult));
          } else {
            nextEdge = edges.find(e => e.source === currentNode?.id);
          }
          currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : undefined;
        }
        const finalState: Execution = {
          ...initialState,
          status: 'completed',
          finishedAt: Date.now(),
          steps,
          result: {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: currentInput,
          },
        };
        this.setState(finalState);
        return Response.json({ success: true, data: finalState });
      } catch (error) {
        const finalState: Execution = {
          ...(this.state as Execution),
          status: 'failed',
          finishedAt: Date.now(),
          result: {
            statusCode: 500,
            headers: {},
            body: { error: error instanceof Error ? error.message : 'Unknown execution error' },
          },
        };
        this.setState(finalState);
        return Response.json({ success: true, data: finalState });
      }
    }
    return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
  }
  private async handleChatRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/messages') {
      return Response.json({ success: true, data: this.state });
    }
    if (request.method === 'POST' && url.pathname === '/chat') {
      return this.handleChatMessage(await request.json());
    }
    if (request.method === 'DELETE' && url.pathname === '/clear') {
      return this.handleClearMessages();
    }
    if (request.method === 'POST' && url.pathname === '/model') {
      return this.handleModelUpdate(await request.json());
    }
    return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model } = body;
    const state = this.state as ChatState;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    if (model) this.chatHandler?.updateModel(model);
    const userMessage = createMessage('user', message.trim());
    this.setState({ ...state, messages: [...state.messages, userMessage], isProcessing: true });
    try {
      if (!this.chatHandler) throw new Error('Chat handler not initialized');
      const response = await this.chatHandler.processMessage(message, state.messages);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...(this.state as ChatState), messages: [...(this.state as ChatState).messages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...(this.state as ChatState), isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private handleClearMessages(): Response {
    this.setState({ ...(this.state as ChatState), messages: [] });
    return Response.json({ success: true, data: this.state });
  }
  private handleModelUpdate(body: { model: string }): Response {
    this.chatHandler?.updateModel(body.model);
    return Response.json({ success: true, data: this.state });
  }
}