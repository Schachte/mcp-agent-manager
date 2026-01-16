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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentConfigService } from '@/services/agentConfigService';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RenameMcpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSuccess?: () => void;
}

export default function RenameMcpDialog({
  open,
  onOpenChange,
  currentName,
  onSuccess,
}: RenameMcpDialogProps) {
  const activeAgent = useActiveAgent();
  const [newName, setNewName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const handleSubmit = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (newName.trim() === currentName) {
      onOpenChange(false);
      return;
    }
    if (!activeAgent?.config_path) {
      toast.error('No agent selected or agent has no config path');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await AgentConfigService.renameMcpInConfig(
        activeAgent.config_path,
        currentName,
        newName.trim()
      );

      if (result.success) {
        toast.success(`MCP renamed to "${newName}"`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to rename MCP');
      }
    } catch (error) {
      console.error('Error renaming MCP:', error);
      toast.error('An error occurred while renaming MCP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewName(currentName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename MCP Server</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{currentName}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
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
                Renaming...
              </>
            ) : (
              'Rename'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
