"use client"

import { useState } from 'react';
import { Check, ChevronDown, Copy, Eye, EyeOff, Key, RefreshCcw, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import useToastNotifications from '@/hooks/use-toast-notifications';

// Mock API key data
const mockApiKeys = [
  {
    id: '1',
    name: 'Mobile App',
    key: 'sk_test_m0b1l3app12345678901234567890',
    created: 'Apr 15, 2025',
    lastUsed: '2 hours ago',
    permissions: ['read', 'write'],
    status: 'active',
  },
  {
    id: '2',
    name: 'Home Assistant Integration',
    key: 'sk_test_h0m3assistant12345678901234',
    created: 'Mar 22, 2025',
    lastUsed: '5 days ago',
    permissions: ['read'],
    status: 'active',
  },
  {
    id: '3',
    name: 'Research Project',
    key: 'sk_test_r3s3arch12345678901234567890',
    created: 'Feb 10, 2025',
    lastUsed: 'Never',
    permissions: ['read'],
    status: 'revoked',
  },
];

// Mock API usage data
const mockApiUsage = [
  { date: 'Apr 27', requests: 245 },
  { date: 'Apr 28', requests: 189 },
  { date: 'Apr 29', requests: 267 },
  { date: 'Apr 30', requests: 321 },
  { date: 'May 1', requests: 392 },
  { date: 'May 2', requests: 278 },
  { date: 'May 3', requests: 215 },
];

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const { toast } = useToastNotifications();

  const toggleKeyVisibility = (id: string) => {
    if (visibleKeys.includes(id)) {
      setVisibleKeys(visibleKeys.filter(key => key !== id));
    } else {
      setVisibleKeys([...visibleKeys, id]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The API key has been copied to your clipboard.",
    });
  };

  const handleCreateKey = () => {
    if (!newKeyName) {
      toast({
        title: "Name required",
        description: "Please provide a name for your API key.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate a mock API key
    const newKey = `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const key = {
      id: `${apiKeys.length + 1}`,
      name: newKeyName,
      key: newKey,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      permissions: newKeyPermissions,
      status: 'active',
    };
    
    setApiKeys([key, ...apiKeys]);
    setNewKeyGenerated(newKey);
    setNewKeyName('');
    setNewKeyPermissions(['read']);
    
    toast({
      title: "API key created",
      description: "Your new API key has been generated successfully.",
    });
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(
      apiKeys.map(key => 
        key.id === id ? { ...key, status: 'revoked' } : key
      )
    );
    
    toast({
      title: "API key revoked",
      description: "The API key has been revoked and can no longer be used for authentication.",
    });
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    
    toast({
      title: "API key deleted",
      description: "The API key has been permanently deleted.",
    });
  };

  const handlePermissionToggle = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission));
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Access</h2>
          <p className="text-muted-foreground">
            Manage API keys and access to your sensor data.
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Key className="mr-2 h-4 w-4" /> {isCreating ? 'Cancel' : 'Create API Key'}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              API keys allow external applications to access your sensor data securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="My Application"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Give your key a descriptive name to identify its purpose.
                </p>
              </div>
              
              <div>
                <Label className="mb-2 block">Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={newKeyPermissions.includes('read') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePermissionToggle('read')}
                    className="flex gap-1 items-center"
                  >
                    {newKeyPermissions.includes('read') && <Check className="h-3.5 w-3.5" />}
                    Read
                  </Button>
                  <Button
                    variant={newKeyPermissions.includes('write') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePermissionToggle('write')}
                    className="flex gap-1 items-center"
                  >
                    {newKeyPermissions.includes('write') && <Check className="h-3.5 w-3.5" />}
                    Write
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Read:</span> Can access sensor readings and device information.<br />
                  <span className="font-medium">Write:</span> Can update device settings and calibration.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>
              Create API Key
            </Button>
          </CardFooter>
        </Card>
      )}

      {newKeyGenerated && (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <Shield className="h-4 w-4" />
          <AlertTitle>New API Key Created</AlertTitle>
          <AlertDescription>
            <div className="mt-2 mb-4">
              <p className="text-sm mb-2">Store this API key securely. For security reasons, we cannot show it again.</p>
              <div className="flex items-center w-full bg-green-100 dark:bg-green-900/50 p-2 rounded-md">
                <code className="font-mono text-sm flex-1 break-all">{newKeyGenerated}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(newKeyGenerated)}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={() => setNewKeyGenerated(null)}>
              I've stored the key securely
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for external integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Key className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No API keys found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first API key to enable external applications.
                    </p>
                    <Button className="mt-4" onClick={() => setIsCreating(true)}>
                      Create API Key
                    </Button>
                  </div>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{key.name}</span>
                            <Badge variant={key.status === 'active' ? 'outline' : 'destructive'} className={key.status === 'active' ? 'border-green-500 text-green-500' : ''}>
                              {key.status === 'active' ? 'Active' : 'Revoked'}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>Created: {key.created}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Last used: {key.lastUsed}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {key.permissions.includes('read') && (
                            <Badge variant="secondary">Read</Badge>
                          )}
                          {key.permissions.includes('write') && (
                            <Badge variant="secondary">Write</Badge>
                          )}
                          {key.status === 'active' ? (
                            <Button variant="outline" size="sm" onClick={() => handleRevokeKey(key.id)}>
                              Revoke
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteKey(key.id)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1 px-0">
                              <ChevronDown className="h-4 w-4" />
                              View Key Details
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 rounded-md bg-muted p-3">
                              <div className="flex items-center">
                                <div className="relative flex-1 font-mono text-sm">
                                  {visibleKeys.includes(key.id) ? key.key : '•'.repeat(30)}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleKeyVisibility(key.id)}
                                >
                                  {visibleKeys.includes(key.id) ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(key.key)}
                                  disabled={key.status !== 'active'}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>
                Your current API usage and limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">This Month's Usage</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">API Requests</p>
                        <p className="text-2xl font-bold">1,897</p>
                        <p className="text-sm text-muted-foreground">of 10,000 limit</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Data Transfer</p>
                        <p className="text-2xl font-bold">45.8 MB</p>
                        <p className="text-sm text-muted-foreground">of 1 GB limit</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Daily Requests (Last 7 Days)</h3>
                    <div className="mt-2 h-32">
                      <div className="flex h-full items-end gap-2">
                        {mockApiUsage.map((day, index) => (
                          <div key={index} className="flex flex-1 flex-col items-center">
                            <div 
                              className="w-full bg-primary/20 rounded-t" 
                              style={{ height: `${(day.requests / 400) * 100}%` }}
                            />
                            <p className="mt-2 text-xs">{day.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">API Limits & Throttling</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">Rate Limit</p>
                        <p className="text-2xl font-bold">100</p>
                        <p className="text-sm text-muted-foreground">requests per minute</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">Monthly Limit</p>
                        <p className="text-2xl font-bold">10,000</p>
                        <p className="text-sm text-muted-foreground">requests per month</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">Data Transfer</p>
                        <p className="text-2xl font-bold">1 GB</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <Alert>
                      <RefreshCcw className="h-4 w-4" />
                      <AlertTitle>Need higher limits?</AlertTitle>
                      <AlertDescription>
                        Contact us to discuss custom API limits for your enterprise needs.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Reference documentation for using the SensorHub API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Getting Started</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The SensorHub API allows you to programmatically access your sensor data and manage your devices.
                  </p>
                  
                  <div className="mt-4 rounded-md bg-muted p-4">
                    <code className="block text-sm">
                      <span className="text-blue-600 dark:text-blue-400">GET</span> https://api.sensorhub.io/v1/devices
                    </code>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Returns a list of all your devices
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All API requests require authentication using your API key.
                  </p>
                  
                  <div className="mt-4 rounded-md bg-muted p-4">
                    <code className="block text-sm">
                      Authorization: Bearer {`<your_api_key>`}
                    </code>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Include this header in all your API requests
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Example Requests</h3>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-md font-medium">Get all devices</h4>
                      <div className="mt-2 rounded-md bg-muted p-4">
                        <code className="block text-sm">
                          curl -X GET \<br />
                          &nbsp;&nbsp;https://api.sensorhub.io/v1/devices \<br />
                          &nbsp;&nbsp;-H 'Authorization: Bearer sk_test_example123456789'
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium">Get sensor readings</h4>
                      <div className="mt-2 rounded-md bg-muted p-4">
                        <code className="block text-sm">
                          curl -X GET \<br />
                          &nbsp;&nbsp;https://api.sensorhub.io/v1/devices/{`{device_id}`}/readings \<br />
                          &nbsp;&nbsp;-H 'Authorization: Bearer sk_test_example123456789'
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium">Update device settings</h4>
                      <div className="mt-2 rounded-md bg-muted p-4">
                        <code className="block text-sm">
                          curl -X PATCH \<br />
                          &nbsp;&nbsp;https://api.sensorhub.io/v1/devices/{`{device_id}`} \<br />
                          &nbsp;&nbsp;-H 'Authorization: Bearer sk_test_example123456789' \<br />
                          &nbsp;&nbsp;-H 'Content-Type: application/json' \<br />
                          &nbsp;&nbsp;-d '{`{"name": "Updated Device Name"}`}'
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline">
                    View Full Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}