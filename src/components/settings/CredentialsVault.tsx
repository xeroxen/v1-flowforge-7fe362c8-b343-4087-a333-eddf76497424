import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CredentialMetadata } from '@shared/types';
export function CredentialsVault() {
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({ name: '', type: 'api_key', value: '' });
  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/credentials');
      if (!response.ok) throw new Error('Failed to fetch credentials');
      const { data } = await response.json();
      setCredentials(data);
    } catch (error) {
      toast.error('Could not load credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchCredentials();
  }, []);
  const handleAddCredential = async () => {
    const promise = fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCredential),
    });
    toast.promise(promise, {
      loading: 'Adding credential...',
      success: () => {
        fetchCredentials();
        setIsDialogOpen(false);
        setNewCredential({ name: '', type: 'api_key', value: '' });
        return 'Credential added successfully!';
      },
      error: 'Failed to add credential.',
    });
  };
  const handleDeleteCredential = async (id: string) => {
    const promise = fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Deleting credential...',
      success: () => {
        fetchCredentials();
        return 'Credential deleted.';
      },
      error: 'Failed to delete credential.',
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credentials Vault</CardTitle>
        <CardDescription>Securely store and manage your API keys and other secrets.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-coral-red text-white hover:bg-red-500">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>Secrets are encrypted and stored securely.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="e.g., My Stripe API Key" value={newCredential.name} onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Secret Value</Label>
                  <Input id="value" type="password" placeholder="sk_test_..." value={newCredential.value} onChange={(e) => setNewCredential({ ...newCredential, value: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCredential}>Save Credential</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : credentials.length > 0 ? (
              credentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell className="font-medium">{cred.name}</TableCell>
                  <TableCell>{cred.type}</TableCell>
                  <TableCell>{new Date(cred.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCredential(cred.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center">No credentials stored yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}