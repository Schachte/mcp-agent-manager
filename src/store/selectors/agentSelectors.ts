import { RootState } from '../index';

export const selectActiveAgent = (state: RootState) => {
  const { agents, activeAgentId } = state.agent;
  const { customAgents, iconUrlOverrides } = state.customAgent;

  // First check built-in agents
  const builtInAgent = agents.find(agent => agent.agent === activeAgentId);
  if (builtInAgent) {
    // Include iconUrl override if present
    const iconUrl = iconUrlOverrides?.[builtInAgent.agent] || builtInAgent.iconUrl;
    return iconUrl ? { ...builtInAgent, iconUrl } : builtInAgent;
  }

  // Check custom agents
  const customAgent = customAgents.find(agent => agent.id === activeAgentId);
  if (customAgent) {
    return {
      agent: customAgent.id,
      name: customAgent.name,
      installed: true,
      config_exists: true,
      config_path: customAgent.configPath,
      cli_available: false,
      install_url: '',
      details: [],
      iconUrl: customAgent.iconUrl,
    };
  }

  return null;
};

export const selectAllAgents = (state: RootState) => state.agent.agents;

export const selectActiveAgentId = (state: RootState) =>
  state.agent.activeAgentId;

export const selectInstalledAgents = (state: RootState) =>
  state.agent.agents.filter(agent => agent.installed);

// Get the effective config path for the active agent (with override support)
export const selectActiveAgentConfigPath = (state: RootState): string | null => {
  const { agents, activeAgentId } = state.agent;
  const { customAgents, configPathOverrides } = state.customAgent;

  if (!activeAgentId) return null;

  // Check for override first
  if (configPathOverrides?.[activeAgentId]) {
    return configPathOverrides[activeAgentId];
  }

  // Check custom agents
  const customAgent = customAgents.find(agent => agent.id === activeAgentId);
  if (customAgent) {
    return customAgent.configPath;
  }

  // Check built-in agents
  const builtInAgent = agents.find(agent => agent.agent === activeAgentId);
  if (builtInAgent) {
    return builtInAgent.config_path;
  }

  return null;
};
