import { useState, useEffect, useCallback } from 'react';
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
import { FolderOpen, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Agent } from '@/store/slices/agentSlice';
import { CustomAgentService } from '@/services/customAgentService';

/**
 * Extract domain from a URL and return a favicon service URL
 */
function getFaviconUrl(url: string): string | null {
  try {
    let urlToParse = url.trim();
    if (!urlToParse) return null;
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsedUrl = new URL(urlToParse);
    const domain = parsedUrl.hostname;
    if (!domain || domain.length < 2) return null;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  isCustomAgent: boolean;
  configPathOverride?: string;
  iconUrlOverride?: string;
  onSave: (data: {
    name?: string;
    configPath: string;
    iconUrl?: string;
  }) => Promise<void>;
}

export default function EditAgentDialog({
  open,
  onOpenChange,
  agent,
  isCustomAgent,
  configPathOverride,
  iconUrlOverride,
  onSave,
}: EditAgentDialogProps) {
  const [name, setName] = useState(agent.name);
  const [configPath, setConfigPath] = useState(configPathOverride || agent.config_path || '');
  const [iconUrl, setIconUrl] = useState(iconUrlOverride || agent.iconUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debouncedIconUrl, setDebouncedIconUrl] = useState(iconUrl);
  const [faviconVisible, setFaviconVisible] = useState(true);

  // Reset form when dialog opens with new agent
  useEffect(() => {
    if (open) {
      setName(agent.name);
      setConfigPath(configPathOverride || agent.config_path || '');
      const initialIconUrl = iconUrlOverride || agent.iconUrl || '';
      setIconUrl(initialIconUrl);
      setDebouncedIconUrl(initialIconUrl);
      setFaviconVisible(true);
    }
  }, [open, agent, configPathOverride, iconUrlOverride]);

  // Debounce iconUrl for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIconUrl(iconUrl);
      setFaviconVisible(true); // Reset visibility when URL changes
    }, 300);
    return () => clearTimeout(timer);
  }, [iconUrl]);

  const handleBrowseConfigPath = async () => {
    const result = await CustomAgentService.selectConfigFile();
    if (result.success && result.path) {
      setConfigPath(result.path);
    }
  };

  const handleRefreshFavicon = useCallback(() => {
    setFaviconVisible(true);
    // Force re-render by briefly clearing and resetting
    setDebouncedIconUrl('');
    setTimeout(() => setDebouncedIconUrl(iconUrl), 50);
    toast.success('Favicon refreshed');
  }, [iconUrl]);

  const handleSubmit = async () => {
    if (!configPath.trim()) {
      toast.error('Please enter a config path');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: isCustomAgent ? name.trim() : undefined,
        configPath: configPath.trim(),
        iconUrl: iconUrl.trim(),
      });
      toast.success('Agent updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faviconPreviewUrl = getFaviconUrl(debouncedIconUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Edit settings for &quot;{agent.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isCustomAgent && (
            <div className="grid gap-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="configPath">Config Path</Label>
            <div className="flex gap-2">
              <Input
                id="configPath"
                placeholder="e.g., ~/.claude/mcp.json"
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
              Path to the JSON file containing MCP configurations. Supports ~ for home directory.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iconUrl">Website URL for Icon (optional)</Label>
            <div className="flex gap-2 items-center">
              {faviconPreviewUrl && faviconVisible && (
                <img
                  src={faviconPreviewUrl}
                  alt="Favicon preview"
                  className="h-8 w-8 object-contain rounded-sm border shrink-0"
                  onError={() => setFaviconVisible(false)}
                  onLoad={() => setFaviconVisible(true)}
                />
              )}
              {!faviconPreviewUrl && iconUrl.trim() && (
                <div className="h-8 w-8 rounded-sm border flex items-center justify-center text-muted-foreground text-xs shrink-0">
                  ?
                </div>
              )}
              <Input
                id="iconUrl"
                placeholder="e.g., https://github.com or github.com"
                value={iconUrl}
                onChange={e => setIconUrl(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefreshFavicon}
                disabled={isSubmitting || !iconUrl.trim()}
                title="Refresh favicon"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any website URL to automatically fetch its favicon as the agent icon
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
