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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSelector } from '@/store/hooks';
import { Agent } from '@/store/slices/agentSlice';
import AgentIcon from './AgentIcon';
import { toast } from 'sonner';

interface InstallToAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverName: string;
  onInstall: (agentId: string) => Promise<void>;
}

export default function InstallToAgentDialog({
  open,
  onOpenChange,
  serverName,
  onInstall,
}: InstallToAgentDialogProps) {
  const agents = useAppSelector(state => state.agent.agents);
  const customAgents = useAppSelector(state => state.customAgent.customAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState(false);

  // Combine built-in and custom agents, filter to only installed ones
  const installedAgents: Agent[] = [
    ...agents.filter(a => a.installed),
    ...customAgents.map(ca => ({
      agent: ca.id,
      name: ca.name,
      installed: true,
      config_exists: true,
      config_path: ca.configPath,
      cli_available: false,
      install_url: '',
      details: [],
    })),
  ];

  const handleInstall = async () => {
    if (!selectedAgentId) return;

    setIsInstalling(true);
    try {
      await onInstall(selectedAgentId);
      const agent = installedAgents.find(a => a.agent === selectedAgentId);
      toast.success(`${serverName} installed to ${agent?.name || selectedAgentId}`);
      onOpenChange(false);
      setSelectedAgentId('');
    } catch (error) {
      console.error('Error installing MCP:', error);
      toast.error('Failed to install MCP');
    } finally {
      setIsInstalling(false);
    }
  };

  const selectedAgent = installedAgents.find(a => a.agent === selectedAgentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Install MCP Server</DialogTitle>
          <DialogDescription>
            Select which agent to install &quot;{serverName}&quot; to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="agent">Target Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent" className="w-full">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {installedAgents.map(agent => (
                  <SelectItem key={agent.agent} value={agent.agent}>
                    <div className="flex items-center gap-2">
                      <AgentIcon agent={agent} className="h-4 w-4" />
                      <span>{agent.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgent && (
              <p className="text-xs text-muted-foreground">
                Config: {selectedAgent.config_path || 'Default location'}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={!selectedAgentId || isInstalling}>
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
