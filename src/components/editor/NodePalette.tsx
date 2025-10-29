import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NODE_MANIFEST } from './custom/node-manifest';
export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, name: nodeName }));
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <aside className="w-72 bg-off-white dark:bg-slate-dark/50 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col">
      <h2 className="text-2xl font-display text-slate-dark dark:text-off-white mb-4">Nodes</h2>
      <Input placeholder="Search nodes..." className="mb-4" />
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {Object.values(NODE_MANIFEST).map((node) => (
            <div
              key={node.name}
              className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center gap-4 cursor-grab bg-white dark:bg-slate-800 hover:shadow-md hover:scale-105 transition-all duration-200"
              onDragStart={(event) => onDragStart(event, node.type, node.name)}
              draggable
            >
              <div className={node.color}>{node.icon}</div>
              <span className="font-medium text-slate-dark dark:text-off-white">{node.name}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}