import { useState, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveAgent } from '@/store/slices/agentSlice';
import { useNavigate, useLocation } from '@tanstack/react-router';
import type { Agent as AgentType } from '@/store/slices/agentSlice';
import {
  hideAgent,
  removeCustomAgent,
  renameCustomAgent,
  updateCustomAgentConfigPath,
  updateCustomAgentIconUrl,
  setConfigPathOverride,
  setIconUrlOverride,
} from '@/store/slices/customAgentSlice';
import { CustomAgentService } from '@/services/customAgentService';
import AgentIcon from './AgentIcon';
import EditAgentDialog from './EditAgentDialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { EyeOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AgentProps {
  agent: AgentType;
  isCustomAgent?: boolean;
  isHidden?: boolean;
}

function Agent({ agent, isCustomAgent = false, isHidden = false }: AgentProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activeAgentId = useAppSelector(state => state.agent.activeAgentId);
  const configPathOverrides = useAppSelector(state => state.customAgent.configPathOverrides);
  const iconUrlOverrides = useAppSelector(state => state.customAgent.iconUrlOverrides);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get effective iconUrl (override for built-in agents, or agent's own iconUrl)
  const effectiveIconUrl = isCustomAgent ? agent.iconUrl : (iconUrlOverrides?.[agent.agent] || undefined);

  const handleSelectAgent = useCallback((agentId: string) => {
    dispatch(setActiveAgent(agentId));
    // Navigate to home page if on marketplace
    if (location.pathname !== '/') {
      navigate({ to: '/' });
    }
  }, [dispatch, navigate, location.pathname]);

  const handleHideAgent = async () => {
    const result = await CustomAgentService.hideAgent(agent.agent);
    if (result.success) {
      dispatch(hideAgent(agent.agent));
      toast.success(`Agent "${agent.name}" hidden`);
    } else {
      toast.error(result.error || 'Failed to hide agent');
    }
  };

  const handleRemoveAgent = async () => {
    if (!isCustomAgent) return;

    const result = await CustomAgentService.removeCustomAgent(agent.agent);
    if (result.success) {
      dispatch(removeCustomAgent(agent.agent));
      toast.success(`Agent "${agent.name}" removed`);
    } else {
      toast.error(result.error || 'Failed to remove agent');
    }
  };

  const handleSaveAgent = async (data: {
    name?: string;
    configPath: string;
    iconUrl?: string;
  }) => {
    const iconUrlToSave = data.iconUrl ?? '';

    if (isCustomAgent) {
      // Update custom agent
      if (data.name) {
        const renameResult = await CustomAgentService.renameCustomAgent(agent.agent, data.name);
        if (renameResult.success) {
          dispatch(renameCustomAgent({ id: agent.agent, newName: data.name }));
        }
      }
      const configResult = await CustomAgentService.updateConfigPath(agent.agent, data.configPath);
      if (configResult.success) {
        dispatch(updateCustomAgentConfigPath({ id: agent.agent, configPath: data.configPath }));
      }
      // Always save iconUrl (even empty to clear it)
      const iconResult = await CustomAgentService.updateIconUrl(agent.agent, iconUrlToSave);
      if (iconResult.success) {
        dispatch(updateCustomAgentIconUrl({ id: agent.agent, iconUrl: iconUrlToSave }));
      }
    } else {
      // For built-in agents, save config path and icon URL as overrides
      dispatch(setConfigPathOverride({ agentId: agent.agent, configPath: data.configPath }));
      await CustomAgentService.saveConfigPathOverride(agent.agent, data.configPath);

      // Always save iconUrl override (even empty to clear it)
      dispatch(setIconUrlOverride({ agentId: agent.agent, iconUrl: iconUrlToSave }));
      await CustomAgentService.saveIconUrlOverride(agent.agent, iconUrlToSave);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={() => agent.installed && handleSelectAgent(agent.agent)}
            disabled={!agent.installed}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-left transition-all w-full',
              agent.installed
                ? activeAgentId == agent.agent
                  ? 'bg-primary/20 text-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                : 'text-muted-foreground/50',
              activeAgentId == agent.agent &&
                agent.installed &&
                'bg-primary/20 text-foreground',
              isHidden && 'opacity-50'
            )}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
              <AgentIcon agent={{ ...agent, iconUrl: effectiveIconUrl }} className="h-5 w-5" />
            </div>
            <span className="flex-1 text-xs font-medium truncate">{agent.name}</span>
            {agent.installed && <span className="status-dot bg-status-online shrink-0" />}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Agent
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleHideAgent}>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide Agent
          </ContextMenuItem>
          {isCustomAgent && (
            <ContextMenuItem
              onClick={handleRemoveAgent}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Agent
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <EditAgentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        agent={agent}
        isCustomAgent={isCustomAgent}
        configPathOverride={configPathOverrides?.[agent.agent]}
        iconUrlOverride={effectiveIconUrl}
        onSave={handleSaveAgent}
      />
    </>
  );
}

export default memo(Agent);
