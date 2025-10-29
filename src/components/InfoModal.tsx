import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, ShieldCheck } from 'lucide-react';
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-coral-red" />
            Important Information
          </DialogTitle>
          <DialogDescription>
            About AI Features & API Key Security
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-8 w-8 text-green-500 mt-1" />
            <div>
              <h4 className="font-semibold">AI Capabilities & API Keys</h4>
              <p className="text-slate-500 dark:text-slate-400">
                This platform includes powerful AI nodes. To use them, you must configure your Cloudflare AI Gateway credentials.
              </p>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-md">
            <p className="font-semibold">Security Notice</p>
            <p className="text-slate-600 dark:text-slate-300">
              For security reasons, API keys cannot be managed directly within this live preview environment. To enable AI features, please export this project to your own GitHub repository, add your API keys as secrets, and deploy it to your Cloudflare account.
            </p>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">Got it</Button>
      </DialogContent>
    </Dialog>
  );
}