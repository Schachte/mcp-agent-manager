// Service for managing custom agents JSON file

import { CustomAgent } from '@/store/slices/customAgentSlice';

const CUSTOM_AGENTS_FILENAME = 'custom-agents.json';

interface CustomAgentsData {
  customAgents: CustomAgent[];
  hiddenAgents: string[];
  configPathOverrides?: Record<string, string>;
  iconUrlOverrides?: Record<string, string>;
}

export class CustomAgentService {
  private static get mcpApi() {
    if (!window.mcpApi) {
      throw new Error(
        'MCP API not available. Make sure the preload script is loaded.'
      );
    }
    return window.mcpApi;
  }

  /**
   * Get the full path to the custom agents JSON file
   */
  static async getCustomAgentsFilePath(): Promise<string> {
    const appDataPath = await this.mcpApi.getAppDataPath();
    return `${appDataPath}/${CUSTOM_AGENTS_FILENAME}`;
  }

  /**
   * Load custom agents data from file
   */
  static async loadCustomAgentsData(): Promise<{
    success: boolean;
    data?: CustomAgentsData;
    error?: string;
  }> {
    try {
      const filePath = await this.getCustomAgentsFilePath();
      const result = await this.mcpApi.readFile(filePath);

      if (!result.success) {
        // File doesn't exist yet, return empty data
        return {
          success: true,
          data: { customAgents: [], hiddenAgents: [] },
        };
      }

      if (!result.content) {
        return {
          success: true,
          data: { customAgents: [], hiddenAgents: [] },
        };
      }

      const data = JSON.parse(result.content) as CustomAgentsData;
      return { success: true, data };
    } catch (error) {
      console.error('Error loading custom agents data:', error);
      // Return empty data on error
      return {
        success: true,
        data: { customAgents: [], hiddenAgents: [] },
      };
    }
  }

  /**
   * Save custom agents data to file
   */
  static async saveCustomAgentsData(
    data: CustomAgentsData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = await this.getCustomAgentsFilePath();
      const content = JSON.stringify(data, null, 2);
      return await this.mcpApi.writeFile(filePath, content);
    } catch (error) {
      console.error('Error saving custom agents data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add a custom agent
   */
  static async addCustomAgent(
    agent: CustomAgent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;

      // Check if agent already exists
      if (data.customAgents.some(a => a.id === agent.id)) {
        return { success: false, error: 'Agent with this ID already exists' };
      }

      data.customAgents.push(agent);
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error adding custom agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove a custom agent
   */
  static async removeCustomAgent(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      data.customAgents = data.customAgents.filter(a => a.id !== agentId);
      data.hiddenAgents = data.hiddenAgents.filter(id => id !== agentId);

      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error removing custom agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rename a custom agent
   */
  static async renameCustomAgent(
    agentId: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      const agent = data.customAgents.find(a => a.id === agentId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.name = newName;
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error renaming custom agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hide an agent (works for both custom and built-in)
   */
  static async hideAgent(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      if (!data.hiddenAgents.includes(agentId)) {
        data.hiddenAgents.push(agentId);
      }

      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error hiding agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Show a hidden agent
   */
  static async showAgent(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      data.hiddenAgents = data.hiddenAgents.filter(id => id !== agentId);

      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error showing agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Select a file path using the system file dialog
   */
  static async selectConfigFile(): Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }> {
    try {
      return await this.mcpApi.selectFile({
        title: 'Select MCP Config File',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });
    } catch (error) {
      console.error('Error selecting config file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a custom agent's config path
   */
  static async updateConfigPath(
    agentId: string,
    configPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      const agent = data.customAgents.find(a => a.id === agentId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.configPath = configPath;
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error updating config path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a custom agent's icon URL
   */
  static async updateIconUrl(
    agentId: string,
    iconUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      const agent = data.customAgents.find(a => a.id === agentId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.iconUrl = iconUrl;
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error updating icon URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save a config path override for a built-in agent
   */
  static async saveConfigPathOverride(
    agentId: string,
    configPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      if (!data.configPathOverrides) {
        data.configPathOverrides = {};
      }

      data.configPathOverrides[agentId] = configPath;
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error saving config path override:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load config path overrides
   */
  static async loadConfigPathOverrides(): Promise<{
    success: boolean;
    overrides?: Record<string, string>;
    error?: string;
  }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: true, overrides: {} };
      }

      return { success: true, overrides: loadResult.data.configPathOverrides || {} };
    } catch (error) {
      console.error('Error loading config path overrides:', error);
      return { success: true, overrides: {} };
    }
  }

  /**
   * Save an icon URL override for a built-in agent
   */
  static async saveIconUrlOverride(
    agentId: string,
    iconUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Failed to load data' };
      }

      const data = loadResult.data;
      if (!data.iconUrlOverrides) {
        data.iconUrlOverrides = {};
      }

      data.iconUrlOverrides[agentId] = iconUrl;
      return await this.saveCustomAgentsData(data);
    } catch (error) {
      console.error('Error saving icon URL override:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load icon URL overrides
   */
  static async loadIconUrlOverrides(): Promise<{
    success: boolean;
    overrides?: Record<string, string>;
    error?: string;
  }> {
    try {
      const loadResult = await this.loadCustomAgentsData();
      if (!loadResult.success || !loadResult.data) {
        return { success: true, overrides: {} };
      }

      return { success: true, overrides: loadResult.data.iconUrlOverrides || {} };
    } catch (error) {
      console.error('Error loading icon URL overrides:', error);
      return { success: true, overrides: {} };
    }
  }
}
