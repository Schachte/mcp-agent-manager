import { User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMcpService } from '@/hooks/useMcpService';
import { useEffect, useEffectEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAgents, setActiveAgent } from '@/store/slices/agentSlice';

interface AgentPanelProps {
  isOpen: boolean;
}

export default function AgentPanel({ isOpen }: AgentPanelProps) {
  const dispatch = useAppDispatch();
  const agents = useAppSelector((state) => state.agent.agents);
  const activeAgentId = useAppSelector((state) => state.agent.activeAgentId);
  const { isInstalled, isLoading, error, getAgents } = useMcpService();

  const getAgentsData = useEffectEvent(async () => {
    const fetchedAgents = await getAgents();
    if (fetchedAgents) {
      // Sort agents: installed first, then by name
      const sortedAgents = [...fetchedAgents].sort((a, b) => {
        if (a.installed === b.installed) {
          return a.name.localeCompare(b.name);
        }
        return a.installed ? -1 : 1;
      });

      dispatch(setAgents(sortedAgents));
      
      // Set first agent as active if none selected
      if (!activeAgentId && sortedAgents.length > 0) {
        dispatch(setActiveAgent(sortedAgents[0].agent));
      }
    }
  });

  const handleSelectAgent = (agentId: string) => {
    dispatch(setActiveAgent(agentId));
  };

  // Compute agents with active flag
  const agentsWithActive = agents.map((agent) => ({
    ...agent,
    active: agent.agent === activeAgentId,
  }));

  useEffect(() => {
    if (isInstalled) {
      getAgentsData();
    }
  }, [isInstalled]);

  return (
    <aside
      className={cn(
        'glass-sidebar flex h-full flex-col p-6 transition-all duration-300 ease-in-out overflow-hidden',
        isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 p-0'
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Agents</h2>
          <p className="text-xs text-muted-foreground">Select an agent</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin">
        {!isInstalled && (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              MCP API not available
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the preload script is loaded
            </p>
          </div>
        )}
        {isInstalled && isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isInstalled && error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load agents
          </div>
        )}
        {isInstalled && !isLoading && !error && agents.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No agents found
          </div>
        )}
        {agentsWithActive.map((agent: any) => (
          <button
            key={agent.agent}
            onClick={() => handleSelectAgent(agent.agent)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
              agent.active
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            {/* <span className="text-2xl">{agent.icon}</span> */}
            <span className="flex-1 text-sm font-medium">{agent.name}</span>
            {agent.installed && (
              <span className="status-dot bg-status-online" />
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
