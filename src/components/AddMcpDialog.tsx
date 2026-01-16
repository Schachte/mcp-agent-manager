import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgentConfigService, McpServerConfig } from '@/services/agentConfigService';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddMcpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddMcpDialog({ open, onOpenChange, onSuccess }: AddMcpDialogProps) {
  const activeAgent = useActiveAgent();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [envVars, setEnvVars] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter an MCP name');
      return;
    }
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }
    if (!activeAgent?.config_path) {
      toast.error('No agent selected or agent has no config path');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse args - split by comma or newline, trim whitespace
      const argsArray = args
        .split(/[,\n]/)
        .map(arg => arg.trim())
        .filter(arg => arg.length > 0);

      // Parse env vars - format: KEY=VALUE per line
      const envObject: Record<string, string> = {};
      if (envVars.trim()) {
        envVars.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              envObject[key.trim()] = valueParts.join('=').trim();
            }
          }
        });
      }

      const mcpConfig: McpServerConfig = {
        command: command.trim(),
      };

      if (argsArray.length > 0) {
        mcpConfig.args = argsArray;
      }

      if (Object.keys(envObject).length > 0) {
        mcpConfig.env = envObject;
      }

      const result = await AgentConfigService.addMcpToConfig(
        activeAgent.config_path,
        name.trim(),
        mcpConfig
      );

      if (result.success) {
        toast.success(`MCP "${name}" added successfully`);
        // Reset form
        setName('');
        setCommand('');
        setArgs('');
        setEnvVars('');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to add MCP');
      }
    } catch (error) {
      console.error('Error adding MCP:', error);
      toast.error('An error occurred while adding MCP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setCommand('');
      setArgs('');
      setEnvVars('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Add a new MCP server to {activeAgent?.name || 'the agent'}&apos;s configuration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., my-mcp-server"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="command">Command</Label>
            <Input
              id="command"
              placeholder="e.g., npx, node, python"
              value={command}
              onChange={e => setCommand(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="args">Arguments (one per line or comma-separated)</Label>
            <Textarea
              id="args"
              placeholder="e.g., -y, @modelcontextprotocol/server-filesystem"
              value={args}
              onChange={e => setArgs(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="env">Environment Variables (KEY=VALUE per line)</Label>
            <Textarea
              id="env"
              placeholder="e.g., API_KEY=your-key"
              value={envVars}
              onChange={e => setEnvVars(e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add MCP'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
