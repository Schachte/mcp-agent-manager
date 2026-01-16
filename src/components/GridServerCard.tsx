import { useState } from 'react';
import { Server, Star, Pencil, Trash2, FileJson, Power, PowerOff, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ServerData } from '@/types/mcp';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { toggleServer, removeServer } from '@/store/slices/serverSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatStars } from '@/utils/commonFunctions';
import { selectProjectLocation } from '@/store/selectors/serverSelectors';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { AgentConfigService } from '@/services/agentConfigService';
import { toast } from 'sonner';
import RenameMcpDialog from './RenameMcpDialog';
import EditMcpConfigDialog from './EditMcpConfigDialog';

type GridServerCardProps = {
  server: ServerData;
  index: number;
  addServerByAgent: (
    agent: string,
    serverName: string,
    projectLocation?: string
  ) => Promise<unknown>;
  removeServerByAgent: (
    serverName: string,
    agent: string,
    projectLocation?: string
  ) => Promise<unknown>;
  onRefresh?: () => void;
};

export default function GridServerCard({
  index,
  server,
  addServerByAgent,
  removeServerByAgent: _removeServerByAgent,
  onRefresh,
}: GridServerCardProps) {
  const { name, description, by, stargazer_count, isEnabled, avatar_url } =
    server;
  const [isToggling, setIsToggling] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeAgent = useActiveAgent();
  const dispatch = useAppDispatch();
  const projectLocation = useAppSelector(selectProjectLocation);

  const handleDeleteMcp = async () => {
    if (!activeAgent?.config_path) return;

    setIsDeleting(true);
    try {
      const result = await AgentConfigService.deleteMcpPermanently(
        activeAgent.config_path,
        name.toLowerCase()
      );

      if (result.success) {
        toast.success(`MCP "${name}" deleted permanently`);
        dispatch(removeServer(name));
        onRefresh?.();
      } else {
        toast.error(result.error || 'Failed to delete MCP');
      }
    } catch (error) {
      console.error('Error deleting MCP:', error);
      toast.error('An error occurred while deleting MCP');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewConfig = async () => {
    if (!activeAgent?.config_path) {
      toast.error('No agent config path available');
      return;
    }

    try {
      const result = await AgentConfigService.getMcpConfig(
        activeAgent.config_path,
        name.toLowerCase()
      );

      if (result.success && result.config) {
        toast.info(
          <div className="max-w-sm">
            <p className="font-semibold mb-1">{name} Config:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(result.config, null, 2)}
            </pre>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(result.error || 'Failed to get MCP config');
      }
    } catch (error) {
      console.error('Error viewing MCP config:', error);
      toast.error('An error occurred while viewing config');
    }
  };

  const onToggle = async () => {
    if (isToggling || !activeAgent?.config_path) return;

    setIsToggling(true);
    try {
      if (isEnabled) {
        // Disable: move to disabled config file
        const result = await AgentConfigService.disableMcp(
          activeAgent.config_path,
          name.toLowerCase()
        );
        if (result.success) {
          toast.success(`MCP "${name}" disabled`);
          dispatch(toggleServer(name));
        } else {
          toast.error(result.error || 'Failed to disable MCP');
        }
      } else {
        // Enable: restore from disabled config file
        const result = await AgentConfigService.enableMcp(
          activeAgent.config_path,
          name.toLowerCase()
        );
        if (result.success) {
          toast.success(`MCP "${name}" enabled`);
          dispatch(toggleServer(name));
        } else {
          // If not in disabled config, try to add via CLI (new server)
          await addServerByAgent(
            activeAgent?.agent || '',
            name.toLowerCase(),
            projectLocation
          );
          dispatch(toggleServer(name));
        }
      }
    } catch (error) {
      console.error('Error toggling MCP:', error);
      toast.error('An error occurred while toggling MCP');
    } finally {
      setIsToggling(false);
    }
  };

  const status = isToggling
    ? isEnabled
      ? 'stopping'
      : 'starting'
    : isEnabled
      ? 'online'
      : 'offline';
  const animationDelay = `${index * 100}ms`;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="border border-border bg-card p-3 transition-all hover:border-primary/50 animate-fade-in"
            style={{ animationDelay }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-muted">
                  {avatar_url ? (
                    <img
                      src={avatar_url}
                      alt={`${name} avatar`}
                      className="h-7 w-7 object-cover"
                    />
                  ) : (
                    <Server className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-xs font-semibold text-foreground break-words">{name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'status-dot',
                    status === 'online' && 'bg-status-online',
                    status === 'offline' && 'bg-status-offline',
                    (status === 'starting' || status === 'stopping') &&
                      'bg-status-restarting'
                  )}
                />
              </div>
            </div>

            <p className="mb-2 text-[10px] text-muted-foreground break-words whitespace-pre-wrap">
              {description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{by}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5" />
                  <span>{formatStars(stargazer_count)}</span>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={onToggle}
                disabled={isToggling || isDeleting}
              />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => setIsRenameDialogOpen(true)}
            disabled={!isEnabled}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsEditConfigDialogOpen(true)}
            disabled={!isEnabled}
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit Config
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleViewConfig}
            disabled={!isEnabled}
          >
            <FileJson className="mr-2 h-4 w-4" />
            View Config
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={onToggle}
            disabled={isToggling}
          >
            {isEnabled ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleDeleteMcp}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Permanently
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <RenameMcpDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        currentName={name.toLowerCase()}
        onSuccess={() => {
          onRefresh?.();
        }}
      />

      <EditMcpConfigDialog
        open={isEditConfigDialogOpen}
        onOpenChange={setIsEditConfigDialogOpen}
        mcpName={name.toLowerCase()}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </>
  );
}
