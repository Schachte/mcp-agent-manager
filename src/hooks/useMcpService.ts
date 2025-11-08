import { useState, useEffect } from 'react';
import { McpRendererService, McpParsedResult } from '@/services/mcpRendererService';
import { useToast } from '@/hooks/use-toast';

export interface UseMcpServiceReturn {
  isInstalled: boolean;
  isLoading: boolean;
  error: string | null;
  checkInstallation: () => Promise<void>;
  executeCommand: (args: string[]) => Promise<McpParsedResult | null>;
  getAgents: () => Promise<any[] | null>;
  getServers: () => Promise<McpParsedResult | null>;
  getServersByAgent: (agent: string) => Promise<McpParsedResult | null>;
  addServerByAgent: (agent: string, serverName: string) => Promise<McpParsedResult | null>;
  removeServerByAgent: (serverName: string, agent: string) => Promise<McpParsedResult | null>;
}

export const useMcpService = (): UseMcpServiceReturn => {
  const [isInstalled, setIsInstalled] = useState(false);
  console.log("🚀 ~ useMcpService ~ isInstalled:", isInstalled)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkInstallation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = await McpRendererService.isInstalled();
      setIsInstalled(installed);
      if (!installed) {
        setError('MCP CLI is not installed. Please install it first.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsInstalled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (args: string[]): Promise<McpParsedResult | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.executeCommand(args);
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Command failed",
          description: result.error || 'Command execution failed',
          variant: "destructive",
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getAgents = async (): Promise<any[] | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.getAgents();
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Command failed",
          description: result.error || 'Failed to get agents',
          variant: "destructive",
        });
        return null;
      }
      return result.data?.agents || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getServers = async (): Promise<McpParsedResult | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.getServers();
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Command failed",
          description: result.error || 'Failed to get servers',
          variant: "destructive",
        });
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getServersByAgent = async (agent: string): Promise<McpParsedResult | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.getServersByAgent(agent);
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Command failed",
          description: result.error || 'Failed to get servers by agent',
          variant: "destructive",
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addServerByAgent = async (agent: string, serverName: string): Promise<McpParsedResult | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.addServerByAgent(agent, serverName);
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Failed to add server",
          description: result.error || 'Failed to add server',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Server added",
          description: `Successfully added ${serverName} to ${agent}`,
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeServerByAgent = async (serverName: string, agent: string): Promise<McpParsedResult | null> => {
    if (!isInstalled) {
      toast({
        title: "MCP CLI not installed",
        description: "Please install MCP CLI first.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await McpRendererService.removeServerByAgent(serverName, agent);
      if (!result.success) {
        setError(result.error);
        toast({
          title: "Failed to remove server",
          description: result.error || 'Failed to remove server',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Server removed",
          description: `Successfully removed ${serverName} from ${agent}`,
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      setError(errorMessage);
      toast({
        title: "Command failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check installation status on mount
  useEffect(() => {
    checkInstallation();
  }, []);

  return {
    isInstalled,
    isLoading,
    error,
    checkInstallation,
    executeCommand,
    getAgents,
    getServers,
    getServersByAgent,
    addServerByAgent,
    removeServerByAgent,
  };
};