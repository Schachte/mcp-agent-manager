// Service for reading and writing agent MCP config files

export interface McpServerConfig {
  command?: string | string[];
  args?: string[];
  env?: Record<string, string>;
  // Opencode specific fields
  type?: 'local' | 'remote';
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
  enabled?: boolean;
}

export interface AgentMcpConfig {
  mcpServers?: Record<string, McpServerConfig>;
  mcp?: Record<string, McpServerConfig>; // Opencode uses 'mcp' key
  [key: string]: unknown;
}

export class AgentConfigService {
  private static get mcpApi() {
    if (!window.mcpApi) {
      throw new Error(
        'MCP API not available. Make sure the preload script is loaded.'
      );
    }
    return window.mcpApi;
  }

  /**
   * Read and parse agent config file
   */
  static async readAgentConfig(configPath: string): Promise<{
    success: boolean;
    config?: AgentMcpConfig;
    error?: string;
  }> {
    try {
      const result = await this.mcpApi.readFile(configPath);
      if (!result.success || !result.content) {
        return { success: false, error: result.error || 'Failed to read file' };
      }

      const config = JSON.parse(result.content) as AgentMcpConfig;
      return { success: true, config };
    } catch (error) {
      console.error('Error reading agent config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Write agent config to file
   */
  static async writeAgentConfig(
    configPath: string,
    config: AgentMcpConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const content = JSON.stringify(config, null, 2);
      return await this.mcpApi.writeFile(configPath, content);
    } catch (error) {
      console.error('Error writing agent config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add an MCP server to the agent config
   */
  static async addMcpToConfig(
    configPath: string,
    name: string,
    mcpConfig: McpServerConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const readResult = await this.readAgentConfig(configPath);

      // If file doesn't exist or is empty, create a new config
      const config: AgentMcpConfig = readResult.success && readResult.config
        ? readResult.config
        : { mcpServers: {} };

      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Check if MCP already exists
      if (config.mcpServers[name]) {
        return { success: false, error: `MCP "${name}" already exists` };
      }

      config.mcpServers[name] = mcpConfig;
      return await this.writeAgentConfig(configPath, config);
    } catch (error) {
      console.error('Error adding MCP to config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove an MCP server from the agent config
   */
  static async removeMcpFromConfig(
    configPath: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      const config = readResult.config;
      if (!config.mcpServers || !config.mcpServers[name]) {
        return { success: false, error: `MCP "${name}" not found` };
      }

      delete config.mcpServers[name];
      return await this.writeAgentConfig(configPath, config);
    } catch (error) {
      console.error('Error removing MCP from config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rename an MCP server in the agent config
   */
  static async renameMcpInConfig(
    configPath: string,
    oldName: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (oldName === newName) {
        return { success: true };
      }

      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      const config = readResult.config;
      if (!config.mcpServers || !config.mcpServers[oldName]) {
        return { success: false, error: `MCP "${oldName}" not found` };
      }

      if (config.mcpServers[newName]) {
        return { success: false, error: `MCP "${newName}" already exists` };
      }

      // Copy the config to new name and delete old
      config.mcpServers[newName] = config.mcpServers[oldName];
      delete config.mcpServers[oldName];

      return await this.writeAgentConfig(configPath, config);
    } catch (error) {
      console.error('Error renaming MCP in config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a specific MCP config from the agent config
   */
  static async getMcpConfig(
    configPath: string,
    name: string
  ): Promise<{ success: boolean; config?: McpServerConfig; error?: string }> {
    try {
      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      const config = readResult.config;
      const mcpKey = this.getMcpKeyForConfig(config);
      const mcpServers = config[mcpKey] as Record<string, McpServerConfig> | undefined;

      if (!mcpServers || !mcpServers[name]) {
        return { success: false, error: `MCP "${name}" not found` };
      }

      return { success: true, config: mcpServers[name] };
    } catch (error) {
      console.error('Error getting MCP config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a specific MCP config in the agent config
   */
  static async updateMcpConfig(
    configPath: string,
    name: string,
    mcpConfig: McpServerConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      const config = readResult.config;
      const mcpKey = this.getMcpKeyForConfig(config);
      const mcpServers = config[mcpKey] as Record<string, McpServerConfig> | undefined;

      if (!mcpServers || !mcpServers[name]) {
        return { success: false, error: `MCP "${name}" not found` };
      }

      mcpServers[name] = mcpConfig;
      return await this.writeAgentConfig(configPath, config);
    } catch (error) {
      console.error('Error updating MCP config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all MCPs in the agent config
   * Supports both standard mcpServers format and opencode's mcp format
   */
  static async listMcpsInConfig(
    configPath: string
  ): Promise<{ success: boolean; mcps?: Record<string, McpServerConfig>; error?: string }> {
    try {
      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      // Support both mcpServers (Claude, etc.) and mcp (Opencode) keys
      const mcps = readResult.config.mcpServers || readResult.config.mcp || {};
      return { success: true, mcps };
    } catch (error) {
      console.error('Error listing MCPs in config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the MCP key name used in the config file
   */
  static getMcpKeyForConfig(config: AgentMcpConfig): 'mcpServers' | 'mcp' {
    if (config.mcp) return 'mcp';
    return 'mcpServers';
  }

  /**
   * Get the disabled config file path for an agent
   */
  static getDisabledConfigPath(configPath: string): string {
    return configPath.replace(/\.json$/, '.disabled.json');
  }

  /**
   * Read the disabled MCP config file
   */
  static async readDisabledConfig(configPath: string): Promise<{
    success: boolean;
    config?: Record<string, McpServerConfig>;
    error?: string;
  }> {
    try {
      const disabledPath = this.getDisabledConfigPath(configPath);
      const result = await this.mcpApi.readFile(disabledPath);

      if (!result.success || !result.content) {
        // File doesn't exist yet, return empty config
        return { success: true, config: {} };
      }

      const config = JSON.parse(result.content) as Record<string, McpServerConfig>;
      return { success: true, config };
    } catch (error) {
      // If file doesn't exist, return empty config
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return { success: true, config: {} };
      }
      console.error('Error reading disabled config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Write the disabled MCP config file
   */
  static async writeDisabledConfig(
    configPath: string,
    config: Record<string, McpServerConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const disabledPath = this.getDisabledConfigPath(configPath);
      const content = JSON.stringify(config, null, 2);
      return await this.mcpApi.writeFile(disabledPath, content);
    } catch (error) {
      console.error('Error writing disabled config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disable an MCP server (move from main config to disabled config)
   */
  static async disableMcp(
    configPath: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Read the main config
      const readResult = await this.readAgentConfig(configPath);
      if (!readResult.success || !readResult.config) {
        return { success: false, error: readResult.error || 'Failed to read config' };
      }

      const config = readResult.config;
      const mcpKey = this.getMcpKeyForConfig(config);
      const mcpServers = config[mcpKey] as Record<string, McpServerConfig> | undefined;

      if (!mcpServers || !mcpServers[name]) {
        return { success: false, error: `MCP "${name}" not found in config` };
      }

      // Read the disabled config
      const disabledResult = await this.readDisabledConfig(configPath);
      if (!disabledResult.success) {
        return { success: false, error: disabledResult.error };
      }

      const disabledConfig = disabledResult.config || {};

      // Move the MCP to disabled config
      disabledConfig[name] = mcpServers[name];
      delete mcpServers[name];

      // Write both configs
      const writeDisabledResult = await this.writeDisabledConfig(configPath, disabledConfig);
      if (!writeDisabledResult.success) {
        return { success: false, error: writeDisabledResult.error };
      }

      return await this.writeAgentConfig(configPath, config);
    } catch (error) {
      console.error('Error disabling MCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enable an MCP server (move from disabled config back to main config)
   */
  static async enableMcp(
    configPath: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Read the disabled config
      const disabledResult = await this.readDisabledConfig(configPath);
      if (!disabledResult.success || !disabledResult.config) {
        return { success: false, error: disabledResult.error || 'Failed to read disabled config' };
      }

      const disabledConfig = disabledResult.config;
      if (!disabledConfig[name]) {
        return { success: false, error: `MCP "${name}" not found in disabled config` };
      }

      // Read the main config
      const readResult = await this.readAgentConfig(configPath);
      const config: AgentMcpConfig = readResult.success && readResult.config
        ? readResult.config
        : { mcpServers: {} };

      const mcpKey = this.getMcpKeyForConfig(config);
      if (!config[mcpKey]) {
        (config as Record<string, unknown>)[mcpKey] = {};
      }
      const mcpServers = config[mcpKey] as Record<string, McpServerConfig>;

      // Move the MCP back to main config
      mcpServers[name] = disabledConfig[name];
      delete disabledConfig[name];

      // Write both configs
      const writeResult = await this.writeAgentConfig(configPath, config);
      if (!writeResult.success) {
        return { success: false, error: writeResult.error };
      }

      return await this.writeDisabledConfig(configPath, disabledConfig);
    } catch (error) {
      console.error('Error enabling MCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all disabled MCPs for an agent
   */
  static async listDisabledMcps(
    configPath: string
  ): Promise<{ success: boolean; mcps?: Record<string, McpServerConfig>; error?: string }> {
    return this.readDisabledConfig(configPath);
  }

  /**
   * Delete an MCP permanently (remove from both main and disabled configs)
   */
  static async deleteMcpPermanently(
    configPath: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let deleted = false;

      // Try to remove from main config
      const readResult = await this.readAgentConfig(configPath);
      if (readResult.success && readResult.config) {
        const config = readResult.config;
        const mcpKey = this.getMcpKeyForConfig(config);
        const mcpServers = config[mcpKey] as Record<string, McpServerConfig> | undefined;

        if (mcpServers && mcpServers[name]) {
          delete mcpServers[name];
          await this.writeAgentConfig(configPath, config);
          deleted = true;
        }
      }

      // Try to remove from disabled config
      const disabledResult = await this.readDisabledConfig(configPath);
      if (disabledResult.success && disabledResult.config) {
        const disabledConfig = disabledResult.config;
        if (disabledConfig[name]) {
          delete disabledConfig[name];
          await this.writeDisabledConfig(configPath, disabledConfig);
          deleted = true;
        }
      }

      if (!deleted) {
        return { success: false, error: `MCP "${name}" not found` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting MCP permanently:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
