import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
import type { WorkflowMetadata, Credential, CredentialMetadata } from '@shared/types';
interface WorkflowExecutions {
    [workflowId: string]: string[];
}
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private workflows = new Map<string, WorkflowMetadata>();
  private workflowExecutions: WorkflowExecutions = {};
  private credentials = new Map<string, Credential>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const stored = await this.ctx.storage.get(['sessions', 'workflows', 'workflowExecutions', 'credentials']);
      this.sessions = new Map(Object.entries(stored.get('sessions') || {}));
      this.workflows = new Map(Object.entries(stored.get('workflows') || {}));
      this.workflowExecutions = (stored.get('workflowExecutions') as WorkflowExecutions) || {};
      this.credentials = new Map(Object.entries(stored.get('credentials') || {}));
      this.loaded = true;
    }
  }
  private async persist(): Promise<void> {
    await this.ctx.storage.put({
        sessions: Object.fromEntries(this.sessions),
        workflows: Object.fromEntries(this.workflows),
        workflowExecutions: this.workflowExecutions,
        credentials: Object.fromEntries(this.credentials),
    });
  }
  // Session Management
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persist();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persist();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persist();
    }
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  // Workflow Management
  async createWorkflow(title: string): Promise<WorkflowMetadata> {
    await this.ensureLoaded();
    const now = Date.now();
    const id = crypto.randomUUID();
    const newWorkflow: WorkflowMetadata = {
      id,
      title,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, newWorkflow);
    await this.persist();
    return newWorkflow;
  }
  async listWorkflows(): Promise<WorkflowMetadata[]> {
    await this.ensureLoaded();
    return Array.from(this.workflows.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  async updateWorkflowMetadata(metadata: Partial<WorkflowMetadata> & { id: string }): Promise<boolean> {
    await this.ensureLoaded();
    const existing = this.workflows.get(metadata.id);
    if (existing) {
      const updated = { ...existing, ...metadata, updatedAt: Date.now() };
      this.workflows.set(metadata.id, updated);
      await this.persist();
      return true;
    }
    return false;
  }
  // Execution Management
  async addExecutionToWorkflow(workflowId: string, executionId: string): Promise<void> {
    await this.ensureLoaded();
    if (!this.workflowExecutions[workflowId]) {
        this.workflowExecutions[workflowId] = [];
    }
    this.workflowExecutions[workflowId].unshift(executionId);
    if (this.workflowExecutions[workflowId].length > 100) {
        this.workflowExecutions[workflowId].pop();
    }
    await this.persist();
  }
  async listExecutionsForWorkflow(workflowId: string): Promise<string[]> {
    await this.ensureLoaded();
    return this.workflowExecutions[workflowId] || [];
  }
  // Credentials Management
  async createCredential(data: Omit<Credential, 'id' | 'createdAt'>): Promise<CredentialMetadata> {
    await this.ensureLoaded();
    const id = crypto.randomUUID();
    const now = Date.now();
    const newCredential: Credential = {
      id,
      ...data,
      createdAt: now,
    };
    this.credentials.set(id, newCredential);
    await this.persist();
    const { value, ...metadata } = newCredential;
    return metadata;
  }
  async listCredentials(): Promise<CredentialMetadata[]> {
    await this.ensureLoaded();
    return Array.from(this.credentials.values())
      .map(({ value, ...metadata }) => metadata)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  async deleteCredential(id: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.credentials.delete(id);
    if (deleted) await this.persist();
    return deleted;
  }
}