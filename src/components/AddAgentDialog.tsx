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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomAgentService } from '@/services/customAgentService';
import { useAppDispatch } from '@/store/hooks';
import { addCustomAgent, CustomAgent } from '@/store/slices/customAgentSlice';
import { toast } from 'sonner';
import { Loader2, FolderOpen } from 'lucide-react';

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Predefined agent templates
const AGENT_TEMPLATES = [
  {
    id: 'opencode',
    name: 'Opencode',
    description: 'Opencode AI MCP support',
    defaultConfigPath: '~/.opencode/mcp.json',
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Define your own agent configuration',
    defaultConfigPath: '',
  },
];

export default function AddAgentDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddAgentDialogProps) {
  const dispatch = useAppDispatch();
  const [selectedTemplate, setSelectedTemplate] = useState('opencode');
  const [name, setName] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      if (templateId !== 'custom') {
        setName(template.name);
        setConfigPath(template.defaultConfigPath);
      } else {
        setName('');
        setConfigPath('');
      }
    }
  };

  const handleBrowseConfigPath = async () => {
    const result = await CustomAgentService.selectConfigFile();
    if (result.success && result.path) {
      setConfigPath(result.path);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter an agent name');
      return;
    }
    if (!configPath.trim()) {
      toast.error('Please enter or select a config path');
      return;
    }

    setIsSubmitting(true);

    try {
      // Expand ~ to home directory if present
      let resolvedPath = configPath.trim();
      if (resolvedPath.startsWith('~')) {
        // This will be expanded on the backend when reading the file
        // For now we keep the ~ notation
      }

      const customAgent: CustomAgent = {
        id: selectedTemplate === 'custom' ? `custom-${Date.now()}` : selectedTemplate,
        name: name.trim(),
        configPath: resolvedPath,
        createdAt: Date.now(),
      };

      const result = await CustomAgentService.addCustomAgent(customAgent);

      if (result.success) {
        dispatch(addCustomAgent(customAgent));
        toast.success(`Agent "${name}" added successfully`);
        // Reset form
        setName('');
        setConfigPath('');
        setSelectedTemplate('opencode');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to add agent');
      }
    } catch (error) {
      console.error('Error adding agent:', error);
      toast.error('An error occurred while adding agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setConfigPath('');
      setSelectedTemplate('opencode');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
          <DialogDescription>
            Add a new AI agent to manage MCP servers. Select a template or configure a custom agent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template">Agent Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id} className="text-left">
                    <div className="flex flex-col items-start text-left">
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., My Custom Agent"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="configPath">MCP Config Path</Label>
            <div className="flex gap-2">
              <Input
                id="configPath"
                placeholder="e.g., ~/.opencode/mcp.json"
                value={configPath}
                onChange={e => setConfigPath(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleBrowseConfigPath}
                disabled={isSubmitting}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Path to the JSON file where MCP servers are configured
            </p>
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
              'Add Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
