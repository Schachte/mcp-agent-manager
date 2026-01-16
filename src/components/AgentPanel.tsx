import { AlertCircle, Sparkles, Plus, Eye, EyeOff, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMcpService } from '@/hooks/useMcpService';
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAgents, setActiveAgent, Agent as AgentType } from '@/store/slices/agentSlice';
import {
  setCustomAgents,
  setHiddenAgents,
  setConfigPathOverrides,
  setIconUrlOverrides,
  toggleShowHiddenAgents,
} from '@/store/slices/customAgentSlice';
import { sortAgents } from '@/utils/commonFunctions';
import { ONE_HOUR_MS } from '@/utils/constants';
import { CustomAgentService } from '@/services/customAgentService';
import Agent from './Agent';
import AddAgentDialog from './AddAgentDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from '@tanstack/react-router';

interface AgentPanelProps {
  isOpen: boolean;
}

export default function AgentPanel({ isOpen }: AgentPanelProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMarketplacePage = location.pathname === '/marketplace';
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAddAgentDialogOpen, setIsAddAgentDialogOpen] = useState(false);

  const agents = useAppSelector(state => state.agent.agents);
  const activeAgentId = useAppSelector(state => state.agent.activeAgentId);
  const lastFetched = useAppSelector(state => state.agent.lastFetched);
  const customAgents = useAppSelector(state => state.customAgent.customAgents);
  const hiddenAgents = useAppSelector(state => state.customAgent.hiddenAgents);
  const showHiddenAgents = useAppSelector(state => state.customAgent.showHiddenAgents);

  const { isInstalled, error, getAgents } = useMcpService();

  // Load custom agents data on mount
  useEffect(() => {
    const loadCustomAgentsData = async () => {
      const result = await CustomAgentService.loadCustomAgentsData();
      if (result.success && result.data) {
        dispatch(setCustomAgents(result.data.customAgents));
        dispatch(setHiddenAgents(result.data.hiddenAgents));
        dispatch(setConfigPathOverrides(result.data.configPathOverrides || {}));
        dispatch(setIconUrlOverrides(result.data.iconUrlOverrides || {}));
      }
    };
    loadCustomAgentsData();
  }, [dispatch]);

  const getAgentsData = useCallback(async () => {
    try {
      // Only show loading skeleton if there are no agents yet
      if (agents.length === 0) {
        setIsInitialLoading(true);
      }
      const fetchedAgents = await getAgents(false);
      if (fetchedAgents) {
        const sortedAgents = sortAgents(fetchedAgents);
        await dispatch(setAgents(sortedAgents));

        if (!activeAgentId && sortedAgents.length > 0) {
          await dispatch(setActiveAgent(sortedAgents[0].agent));
        }
      }
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [getAgents, dispatch, activeAgentId, agents.length]);

  useEffect(() => {
    if (isInstalled) {
      const now = Date.now();
      const isStale = !lastFetched || now - lastFetched > ONE_HOUR_MS;

      if (isStale) {
        getAgentsData();
      } else if (!activeAgentId && agents.length > 0) {
        dispatch(setActiveAgent(agents[0].agent));
        setIsInitialLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    } else {
      setIsInitialLoading(false);
    }
  }, [isInstalled, lastFetched, activeAgentId, agents, dispatch, getAgentsData]);

  // Convert custom agents to Agent format
  const customAgentsAsAgentType: AgentType[] = customAgents.map(ca => ({
    agent: ca.id,
    name: ca.name,
    installed: true,
    config_exists: true,
    config_path: ca.configPath,
    cli_available: false,
    install_url: '',
    details: [],
    iconUrl: ca.iconUrl,
  }));

  // Filter out hidden agents
  const visibleAgents = agents.filter(
    agent => showHiddenAgents || !hiddenAgents.includes(agent.agent)
  );
  const visibleCustomAgents = customAgentsAsAgentType.filter(
    agent => showHiddenAgents || !hiddenAgents.includes(agent.agent)
  );

  // Get hidden agents for "show hidden" section
  const hiddenBuiltInAgents = agents.filter(agent => hiddenAgents.includes(agent.agent));
  const hiddenCustomAgentsList = customAgentsAsAgentType.filter(agent =>
    hiddenAgents.includes(agent.agent)
  );

  const hasHiddenAgents = hiddenBuiltInAgents.length > 0 || hiddenCustomAgentsList.length > 0;

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-sidebar-background transition-all duration-300 ease-in-out overflow-hidden',
        isOpen ? 'w-52 opacity-100' : 'w-0 opacity-0'
      )}
    >
      {/* Marketplace Section */}
      <div className="p-2 border-b border-border">
        <Link to="/marketplace">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full h-7 text-xs justify-start",
              isMarketplacePage && "text-foreground"
            )}
          >
            <Store className="mr-2 h-3.5 w-3.5" />
            Marketplace
          </Button>
        </Link>
      </div>

      {/* Agents Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">AI Agents</span>
        </div>
      </div>

      {/* Agents List */}
      <div className="flex flex-col gap-0.5 overflow-y-auto scrollbar-thin flex-1 py-1">
        {!isInstalled && agents.length === 0 && customAgents.length === 0 && (
          <div className="flex flex-col items-center gap-2 bg-muted/50 p-3 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              MCP API not available
            </p>
            <p className="text-[10px] text-muted-foreground">
              Make sure the preload script is loaded
            </p>
          </div>
        )}
        {isInstalled && isInitialLoading && (
          <div className="space-y-1">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {isInstalled && error && agents.length === 0 && (
          <div className="bg-destructive/10 p-3 text-xs text-destructive">
            Failed to load agents
          </div>
        )}
        {isInstalled && !isInitialLoading && !error && agents.length === 0 && customAgents.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No agents found
          </div>
        )}
        {/* Built-in agents */}
        {isInstalled &&
          !isInitialLoading &&
          visibleAgents.map(agent => (
            <Agent
              key={agent.agent}
              agent={agent}
              isCustomAgent={false}
              isHidden={hiddenAgents.includes(agent.agent)}
            />
          ))}
        {/* Custom agents */}
        {visibleCustomAgents.map(agent => (
          <Agent
            key={agent.agent}
            agent={agent}
            isCustomAgent={true}
            isHidden={hiddenAgents.includes(agent.agent)}
          />
        ))}

        {/* Hidden agents section */}
        {hasHiddenAgents && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={() => dispatch(toggleShowHiddenAgents())}
            >
              {showHiddenAgents ? (
                <>
                  <EyeOff className="mr-2 h-3 w-3" />
                  Hide hidden agents ({hiddenBuiltInAgents.length + hiddenCustomAgentsList.length})
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-3 w-3" />
                  Show hidden agents ({hiddenBuiltInAgents.length + hiddenCustomAgentsList.length})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Add Agent Button */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setIsAddAgentDialogOpen(true)}
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Agent
        </Button>
      </div>

      <AddAgentDialog
        open={isAddAgentDialogOpen}
        onOpenChange={setIsAddAgentDialogOpen}
        onSuccess={() => {
          // Refresh is handled by Redux
        }}
      />
    </aside>
  );
}
