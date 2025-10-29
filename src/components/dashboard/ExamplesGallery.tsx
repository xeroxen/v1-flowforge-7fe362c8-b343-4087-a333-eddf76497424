import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
const EXAMPLES = [
  {
    id: 'webhook-transform-respond',
    title: 'Webhook → Transform → Respond',
    description: 'Receive a webhook, modify the JSON payload, and return the result immediately.',
  },
  {
    id: 'webhook-condition-http',
    title: 'Webhook → Condition → HTTP',
    description: 'Call one of two different services based on the incoming webhook data.',
  },
  {
    id: 'schedule-http-ai',
    title: 'Schedule → HTTP → AI',
    description: 'Fetch data from an API on a schedule and send it to an AI for summary.',
  },
];
export function ExamplesGallery() {
  const navigate = useNavigate();
  const handleImport = async (exampleId: string) => {
    const promise = fetch('/api/workflows/import-example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exampleId }),
    });
    toast.promise(promise, {
      loading: 'Importing example...',
      success: (res) => {
        if (!res.ok) throw new Error('Failed to import');
        res.json().then(({ data }) => {
          navigate(`/workflows/${data.id}`);
        });
        return 'Example imported successfully! Redirecting...';
      },
      error: 'Failed to import example.',
    });
  };
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold font-sans mb-4">Start with an Example</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXAMPLES.map((example) => (
          <Card key={example.id} className="bg-white dark:bg-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle className="font-sans text-lg">{example.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-slate-500 dark:text-slate-400">{example.description}</p>
            </CardContent>
            <div className="p-4 pt-0">
              <Button variant="outline" className="w-full" onClick={() => handleImport(example.id)}>
                <Download className="h-4 w-4 mr-2" />
                Import Example
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}