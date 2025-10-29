import type { Node, ExecutionStep, Condition } from '@shared/types';
import OpenAI from 'openai';
interface ExecutionContext {
  [nodeId: string]: any;
}
function resolveValue(path: string, context: ExecutionContext, input: any) {
  if (typeof path !== 'string') return path;
  // Handle simple `{{data}}` case
  if (path.trim() === '{{data}}') {
    return input;
  }
  // Handle JSON stringified `{{data}}`
  if (path.trim() === '{{JSON.stringify(data)}}') {
    return JSON.stringify(input, null, 2);
  }
  // Use regex for more complex replacements
  return path.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
    const cleanPath = expression.trim();
    const parts = cleanPath.split('.');
    let current;
    if (parts[0].toLowerCase() === 'data') {
      current = input;
      parts.shift();
    } else {
      const nodeName = parts[0];
      current = context[nodeName];
      parts.shift();
    }
    for (const key of parts) {
      if (current === undefined || current === null) return match; // Return original match if path is invalid
      current = current[key];
    }
    if (typeof current === 'object') {
      return JSON.stringify(current, null, 2);
    }
    return current !== undefined ? current : match;
  });
}
export async function executeNode(node: Node, input: any, context: ExecutionContext, env: any): Promise<Omit<ExecutionStep, 'durationMs'>> {
  const nodeType = String(node.data.label).replace(/ \d+$/, '');
  try {
    let output: any;
    switch (nodeType) {
      case 'Webhook':
        output = input; // Webhook simply passes the trigger data
        break;
      case 'HTTP Request':
        output = await executeHttpRequest(node, input, context);
        break;
      case 'Transform':
        output = executeTransform(node, input, context);
        break;
      case 'Condition':
        output = executeCondition(node, input, context);
        break;
      case 'Code':
        output = await executeCode(node, input, context);
        break;
      case 'AI Call':
        output = await executeAICall(node, input, context, env);
        break;
      case 'Respond to Webhook':
        output = executeRespondToWebhook(node, input, context);
        break;
      default:
        throw new Error(`Node type "${nodeType}" is not yet implemented.`);
    }
    return {
      nodeId: node.id,
      nodeLabel: node.data.label,
      status: 'success',
      input,
      output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      nodeId: node.id,
      nodeLabel: node.data.label,
      status: 'error',
      input,
      output: { error: errorMessage },
      error: errorMessage,
    };
  }
}
async function executeHttpRequest(node: Node, input: any, context: ExecutionContext): Promise<any> {
  const { url, method = 'GET' } = node.data;
  if (!url) {
    throw new Error('HTTP Request node is missing a URL.');
  }
  const resolvedUrl = resolveValue(url, context, input);
  const response = await fetch(resolvedUrl, {
    method: method.toUpperCase(),
    headers: { 'Content-Type': 'application/json' },
    body: method.toUpperCase() !== 'GET' ? JSON.stringify(input) : undefined,
  });
  const responseBody = await response.json().catch(() => response.text());
  return {
    statusCode: response.status,
    headers: Object.fromEntries([...response.headers]),
    body: responseBody,
  };
}
function executeTransform(node: Node, input: any, context: ExecutionContext): any {
  const { expression } = node.data;
  if (!expression) {
    return input; // Pass through if no expression
  }
  try {
    const func = new Function('data', 'context', `return ${expression}`);
    return func(input, context);
  } catch (e: unknown) {
    throw new Error(`Transform expression error: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}
function executeCondition(node: Node, input: any, context: ExecutionContext): any {
  const conditions: Condition[] = node.data.conditions || [];
  if (conditions.length === 0) {
    return { result: true }; // Default to true if no conditions
  }
  for (const condition of conditions) {
    const left = resolveValue(condition.variable, context, input);
    const right = resolveValue(condition.value, context, input);
    let result = false;
    switch (condition.operator) {
      case '===': result = left === right; break;
      case '!==': result = left !== right; break;
      case '>': result = left > right; break;
      case '<': result = left < right; break;
      case '>=': result = left >= right; break;
      case '<=': result = left <= right; break;
    }
    if (!result) {
      return { result: false }; // AND logic, first failure returns false
    }
  }
  return { result: true };
}
async function executeCode(node: Node, input: any, context: ExecutionContext): Promise<any> {
  const { code } = node.data;
  if (!code) return input;
  try {
    // Basic sandboxing - this is NOT secure for production against malicious code
    const func = new Function('data', 'context', code);
    return await Promise.resolve(func(input, context));
  } catch (e) {
    throw new Error(`Code execution error: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}
async function executeAICall(node: Node, input: any, context: ExecutionContext, env: any): Promise<any> {
  const { prompt } = node.data;
  if (!prompt) throw new Error('AI Call node is missing a prompt.');
  if (!env.CF_AI_BASE_URL || !env.CF_AI_API_KEY) {
    throw new Error('AI Gateway environment variables are not configured.');
  }
  const resolvedPrompt = resolveValue(prompt, context, input);
  const openai = new OpenAI({
    baseURL: env.CF_AI_BASE_URL,
    apiKey: env.CF_AI_API_KEY,
  });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: resolvedPrompt }],
  });
  return completion.choices[0].message.content;
}
function executeRespondToWebhook(node: Node, input: any, context: ExecutionContext): any {
  const { statusCode = 200, body = '{{data}}' } = node.data;
  const resolvedBody = resolveValue(body, context, input);
  let finalBody;
  try {
    // If resolvedBody is a string that looks like an object, parse it.
    finalBody = JSON.parse(resolvedBody);
  } catch (e) {
    // Otherwise, use it as a string.
    finalBody = resolvedBody;
  }
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: finalBody,
  };
}