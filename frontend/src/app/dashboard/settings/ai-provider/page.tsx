'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, Bot, Zap, Search, Send } from 'lucide-react';
import { getAiProviderConfig, saveAiProviderConfig, verifyAiProviderConnection } from './actions';

interface AiProviderConfig {
  id: string;
  api_url: string;
  api_key: string;
  api_key_masked: boolean;
  agent_id?: string;
  is_active: boolean;
  verified_at?: string;
  openrouter_api_key?: string | null;
  telegram_bot_token?: string | null;
  brave_search_api_key?: string | null;
}

function MaskedInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  description,
  icon: Icon,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function AiProviderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [config, setConfig] = useState<AiProviderConfig | null>(null);
  const [formData, setFormData] = useState({
    api_url: '',
    api_key: '',
    agent_id: '',
    openrouter_api_key: '',
    telegram_bot_token: '',
    brave_search_api_key: '',
  });
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getAiProviderConfig();

      if (data) {
        setConfig(data);
        setFormData({
          api_url: data.api_url || '',
          api_key: '',
          agent_id: data.agent_id || '',
          openrouter_api_key: '',
          telegram_bot_token: '',
          brave_search_api_key: '',
        });
      }
    } catch (error) {
      console.error('Failed to load AI provider config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConnection = async () => {
    setVerifying(true);
    setAlert(null);

    try {
      if (!formData.api_key && !config) {
        setAlert({ type: 'error', message: 'Please save your API key first, then verify' });
        setVerifying(false);
        return;
      }

      // Send the new key if provided, otherwise backend will use the stored key
      const result = await verifyAiProviderConnection({
        api_url: formData.api_url,
        api_key: formData.api_key || undefined,
        agent_id: formData.agent_id,
      });

      if (result.success) {
        setAlert({ type: 'success', message: result.message || 'Connection verified successfully!' });
        // Refresh config to get updated verified_at
        loadConfig();
      } else {
        setAlert({ type: 'error', message: `Connection failed: ${result.message || 'Unknown error'}` });
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: `Verification error: ${error.message}` });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);

    try {
      const payload: any = {
        api_url: formData.api_url,
        agent_id: formData.agent_id,
      };

      // Only include fields if user entered a new value
      if (formData.api_key) payload.api_key = formData.api_key;
      if (formData.openrouter_api_key) payload.openrouter_api_key = formData.openrouter_api_key;
      if (formData.telegram_bot_token) payload.telegram_bot_token = formData.telegram_bot_token;
      if (formData.brave_search_api_key) payload.brave_search_api_key = formData.brave_search_api_key;

      const result = await saveAiProviderConfig(payload);

      if (result.error) {
        setAlert({ type: 'error', message: `Failed to save: ${result.error}` });
      } else {
        setConfig(result);
        setFormData({
          api_url: result.api_url,
          api_key: '',
          agent_id: result.agent_id || '',
          openrouter_api_key: '',
          telegram_bot_token: '',
          brave_search_api_key: '',
        });
        setAlert({ type: 'success', message: 'All OpenClaw credentials saved successfully!' });
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: `Save error: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">OpenClaw Settings</h1>
      <p className="text-muted-foreground mb-6">
        Configure your OpenClaw AI instance and service credentials. All keys are encrypted at rest.
      </p>

      {alert && (
        <Alert
          className={`mb-6 ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800'
              : alert.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : alert.type === 'error' ? (
            <XCircle className="h-4 w-4" />
          ) : null}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            OpenClaw Connection
          </CardTitle>
          <CardDescription>
            Connect to your self-hosted OpenClaw AI instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_url">Server URL *</Label>
            <Input
              id="api_url"
              type="url"
              placeholder="http://your-ip:18789 or https://your-openclaw.com"
              value={formData.api_url}
              onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              The base URL of your OpenClaw instance (include port, e.g. http://your-server:18789)
            </p>
          </div>

          <MaskedInput
            id="api_key"
            label="API Key *"
            placeholder={config ? 'Enter new key to update (leave blank to keep current)' : 'Your OpenClaw API key'}
            value={formData.api_key}
            onChange={(v) => setFormData({ ...formData, api_key: v })}
            description="Your OpenClaw authentication key (stored encrypted)"
          />

          <div className="space-y-2">
            <Label htmlFor="agent_id">Agent ID (Optional)</Label>
            <Input
              id="agent_id"
              type="text"
              placeholder="default-agent"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Specific agent identifier if using multiple agents
            </p>
          </div>

          {config?.verified_at && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Last verified: {new Date(config.verified_at).toLocaleString()}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleVerifyConnection} variant="outline" disabled={!formData.api_url || verifying}>
              {verifying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                'Verify Connection'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: AI Model Service */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Model (OpenRouter)
          </CardTitle>
          <CardDescription>
            OpenRouter routes requests to the best AI model. Provide your key for OpenClaw to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaskedInput
            id="openrouter_api_key"
            label="OpenRouter API Key"
            placeholder={config?.openrouter_api_key ? 'Enter new key to update' : 'sk-or-v1-...'}
            value={formData.openrouter_api_key}
            onChange={(v) => setFormData({ ...formData, openrouter_api_key: v })}
            description="OpenRouter API key for AI model access"
            icon={Zap}
          />
          {config?.openrouter_api_key && (
            <p className="text-xs text-muted-foreground mt-2">
              Current: {config.openrouter_api_key}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Services */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Additional Services
          </CardTitle>
          <CardDescription>
            Optional service credentials for enhanced OpenClaw capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MaskedInput
            id="brave_search_api_key"
            label="Brave Search API Key"
            placeholder={config?.brave_search_api_key ? 'Enter new key to update' : 'BSA...'}
            value={formData.brave_search_api_key}
            onChange={(v) => setFormData({ ...formData, brave_search_api_key: v })}
            description="Enables web search capabilities for OpenClaw"
            icon={Search}
          />
          {config?.brave_search_api_key && (
            <p className="text-xs text-muted-foreground -mt-4">
              Current: {config.brave_search_api_key}
            </p>
          )}

          <MaskedInput
            id="telegram_bot_token"
            label="Telegram Bot Token"
            placeholder={config?.telegram_bot_token ? 'Enter new token to update' : '1234567890:ABC...'}
            value={formData.telegram_bot_token}
            onChange={(v) => setFormData({ ...formData, telegram_bot_token: v })}
            description="Telegram bot token for notifications and alerts"
            icon={Send}
          />
          {config?.telegram_bot_token && (
            <p className="text-xs text-muted-foreground -mt-4">
              Current: {config.telegram_bot_token}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!formData.api_url || saving} size="lg">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            'Save All Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
