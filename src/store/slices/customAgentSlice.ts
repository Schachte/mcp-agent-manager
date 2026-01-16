import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CustomAgent {
  id: string;
  name: string;
  configPath: string;
  iconUrl?: string; // URL to load favicon/icon from
  createdAt: number;
}

interface CustomAgentState {
  customAgents: CustomAgent[];
  hiddenAgents: string[]; // List of hidden agent IDs (both custom and built-in)
  showHiddenAgents: boolean;
  configPathOverrides: Record<string, string>; // Override config paths for built-in agents
  iconUrlOverrides: Record<string, string>; // Override icon URLs for built-in agents
}

const initialState: CustomAgentState = {
  customAgents: [],
  hiddenAgents: [],
  showHiddenAgents: false,
  configPathOverrides: {},
  iconUrlOverrides: {},
};

const customAgentSlice = createSlice({
  name: 'customAgent',
  initialState,
  reducers: {
    addCustomAgent: (state, action: PayloadAction<CustomAgent>) => {
      // Check if agent with same id already exists
      const exists = state.customAgents.some(
        agent => agent.id === action.payload.id
      );
      if (!exists) {
        state.customAgents.push(action.payload);
      }
    },
    removeCustomAgent: (state, action: PayloadAction<string>) => {
      state.customAgents = state.customAgents.filter(
        agent => agent.id !== action.payload
      );
      // Also remove from hidden if it was hidden
      state.hiddenAgents = state.hiddenAgents.filter(
        id => id !== action.payload
      );
    },
    renameCustomAgent: (
      state,
      action: PayloadAction<{ id: string; newName: string }>
    ) => {
      const agent = state.customAgents.find(a => a.id === action.payload.id);
      if (agent) {
        agent.name = action.payload.newName;
      }
    },
    updateCustomAgentConfigPath: (
      state,
      action: PayloadAction<{ id: string; configPath: string }>
    ) => {
      const agent = state.customAgents.find(a => a.id === action.payload.id);
      if (agent) {
        agent.configPath = action.payload.configPath;
      }
    },
    updateCustomAgentIconUrl: (
      state,
      action: PayloadAction<{ id: string; iconUrl: string }>
    ) => {
      const agent = state.customAgents.find(a => a.id === action.payload.id);
      if (agent) {
        agent.iconUrl = action.payload.iconUrl;
      }
    },
    hideAgent: (state, action: PayloadAction<string>) => {
      if (!state.hiddenAgents.includes(action.payload)) {
        state.hiddenAgents.push(action.payload);
      }
    },
    showAgent: (state, action: PayloadAction<string>) => {
      state.hiddenAgents = state.hiddenAgents.filter(
        id => id !== action.payload
      );
    },
    toggleShowHiddenAgents: state => {
      state.showHiddenAgents = !state.showHiddenAgents;
    },
    setShowHiddenAgents: (state, action: PayloadAction<boolean>) => {
      state.showHiddenAgents = action.payload;
    },
    setCustomAgents: (state, action: PayloadAction<CustomAgent[]>) => {
      state.customAgents = action.payload;
    },
    setHiddenAgents: (state, action: PayloadAction<string[]>) => {
      state.hiddenAgents = action.payload;
    },
    setConfigPathOverride: (
      state,
      action: PayloadAction<{ agentId: string; configPath: string }>
    ) => {
      state.configPathOverrides[action.payload.agentId] = action.payload.configPath;
    },
    removeConfigPathOverride: (state, action: PayloadAction<string>) => {
      delete state.configPathOverrides[action.payload];
    },
    setConfigPathOverrides: (state, action: PayloadAction<Record<string, string>>) => {
      state.configPathOverrides = action.payload;
    },
    setIconUrlOverride: (
      state,
      action: PayloadAction<{ agentId: string; iconUrl: string }>
    ) => {
      state.iconUrlOverrides[action.payload.agentId] = action.payload.iconUrl;
    },
    removeIconUrlOverride: (state, action: PayloadAction<string>) => {
      delete state.iconUrlOverrides[action.payload];
    },
    setIconUrlOverrides: (state, action: PayloadAction<Record<string, string>>) => {
      state.iconUrlOverrides = action.payload;
    },
  },
});

export const {
  addCustomAgent,
  removeCustomAgent,
  renameCustomAgent,
  updateCustomAgentConfigPath,
  updateCustomAgentIconUrl,
  hideAgent,
  showAgent,
  toggleShowHiddenAgents,
  setShowHiddenAgents,
  setCustomAgents,
  setHiddenAgents,
  setConfigPathOverride,
  removeConfigPathOverride,
  setConfigPathOverrides,
  setIconUrlOverride,
  removeIconUrlOverride,
  setIconUrlOverrides,
} = customAgentSlice.actions;

export default customAgentSlice.reducer;
