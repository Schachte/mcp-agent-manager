import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgentConfigService, McpServerConfig } from '@/services/agentConfigService';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditMcpConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpName: string;
  onSuccess?: () => void;
}

export default function EditMcpConfigDialog({
  open,
  onOpenChange,
  mcpName,
  onSuccess,
}: EditMcpConfigDialogProps) {
  const activeAgent = useActiveAgent();
  const [configJson, setConfigJson] = useState('');
  const [originalConfig, setOriginalConfig] = useState<McpServerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (open && activeAgent?.config_path) {
      loadConfig();
    }
  }, [open, mcpName, activeAgent?.config_path]);

  const loadConfig = async () => {
    if (!activeAgent?.config_path) return;

    setIsLoading(true);
    setJsonError(null);

    try {
      const result = await AgentConfigService.getMcpConfig(
        activeAgent.config_path,
        mcpName
      );

      if (result.success && result.config) {
        setOriginalConfig(result.config);
        setConfigJson(JSON.stringify(result.config, null, 2));
      } else {
        toast.error(result.error || 'Failed to load MCP config');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error loading MCP config:', error);
      toast.error('An error occurred while loading config');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateJson = (value: string): McpServerConfig | null => {
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError('Invalid JSON format');
      return null;
    }
  };

  const handleConfigChange = (value: string) => {
    setConfigJson(value);
    validateJson(value);
  };

  const handleSubmit = async () => {
    const parsedConfig = validateJson(configJson);
    if (!parsedConfig) {
      toast.error('Please fix JSON errors before saving');
      return;
    }

    if (!activeAgent?.config_path) {
      toast.error('No agent selected or agent has no config path');
      return;
    }

    // Check if config changed
    if (JSON.stringify(parsedConfig) === JSON.stringify(originalConfig)) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await AgentConfigService.updateMcpConfig(
        activeAgent.config_path,
        mcpName,
        parsedConfig
      );

      if (result.success) {
        toast.success(`MCP "${mcpName}" config updated`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to update MCP config');
      }
    } catch (error) {
      console.error('Error updating MCP config:', error);
      toast.error('An error occurred while updating config');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setConfigJson('');
      setOriginalConfig(null);
      setJsonError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit MCP Config</DialogTitle>
          <DialogDescription>
            Edit the configuration for &quot;{mcpName}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={configJson}
                onChange={e => handleConfigChange(e.target.value)}
                disabled={isSubmitting}
                className="font-mono text-xs min-h-[200px]"
                placeholder="Loading..."
              />
              {jsonError && (
                <p className="text-xs text-destructive">{jsonError}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading || !!jsonError}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
