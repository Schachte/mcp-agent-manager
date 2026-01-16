// Service for fetching MCP servers from the official MCP Registry
// https://registry.modelcontextprotocol.io

import { ServerData } from '@/types/mcp';

const REGISTRY_BASE_URL = 'https://registry.modelcontextprotocol.io';
const API_VERSION = 'v0.1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for registry results
const cache: Map<string, CacheEntry<RegistryFetchResult>> = new Map();

interface RegistryServerPackage {
  registryType: string;
  identifier: string;
  version: string;
  transport?: {
    type: string;
  };
  environmentVariables?: Array<{
    name: string;
    description: string;
    format?: string;
    isSecret?: boolean;
  }>;
}

interface RegistryServerRemote {
  type: string;
  url: string;
}

interface RegistryServer {
  $schema?: string;
  name: string;
  description: string;
  repository?: {
    url: string;
    source?: string;
  };
  version: string;
  packages?: RegistryServerPackage[];
  remotes?: RegistryServerRemote[];
}

interface RegistryServerMeta {
  'io.modelcontextprotocol.registry/official'?: {
    status: string;
    publishedAt: string;
    updatedAt: string;
    isLatest: boolean;
  };
}

interface RegistryServerEntry {
  server: RegistryServer;
  _meta?: RegistryServerMeta;
}

interface RegistryResponse {
  servers: RegistryServerEntry[];
  metadata: {
    nextCursor?: string;
    count: number;
  };
}

export interface RegistryFetchResult {
  servers: ServerData[];
  nextCursor?: string;
  totalCount: number;
}

export class McpRegistryService {
  /**
   * Generate a cache key from fetch options
   */
  private static getCacheKey(options: { limit?: number; cursor?: string; search?: string }): string {
    return JSON.stringify(options);
  }

  /**
   * Check if a cache entry is still valid
   */
  private static isCacheValid(entry: CacheEntry<RegistryFetchResult>): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  /**
   * Clear the registry cache
   */
  static clearCache(): void {
    cache.clear();
  }

  /**
   * Get cache timestamp (for UI display)
   */
  static getLastFetchTime(): number | null {
    const entries = Array.from(cache.values());
    if (entries.length === 0) return null;
    return Math.max(...entries.map(e => e.timestamp));
  }

  /**
   * Fetch servers from the MCP Registry
   */
  static async fetchServers(options: {
    limit?: number;
    cursor?: string;
    search?: string;
    skipCache?: boolean;
  } = {}): Promise<RegistryFetchResult> {
    const { limit = 50, cursor, search, skipCache = false } = options;
    const cacheKey = this.getCacheKey({ limit, cursor, search });

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cachedEntry = cache.get(cacheKey);
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        return cachedEntry.data;
      }
    }

    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('version', 'latest');

      if (cursor) {
        params.set('cursor', cursor);
      }

      if (search) {
        params.set('search', search);
      }

      const url = `${REGISTRY_BASE_URL}/${API_VERSION}/servers?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Registry API error: ${response.status}`);
      }

      const data: RegistryResponse = await response.json();

      // Transform registry format to our ServerData format
      const servers: ServerData[] = data.servers.map(entry => {
        const { server } = entry;

        // Extract owner from repository URL if available
        let owner = 'MCP Registry';
        if (server.repository?.url) {
          const match = server.repository.url.match(/github\.com\/([^/]+)/);
          if (match) {
            owner = match[1];
          }
        }

        // Build avatar URL from GitHub owner
        let avatarUrl = '';
        if (server.repository?.url?.includes('github.com')) {
          const match = server.repository.url.match(/github\.com\/([^/]+)/);
          if (match) {
            avatarUrl = `https://github.com/${match[1]}.png?size=40`;
          }
        }

        // Build MCP config from packages
        const mcpConfig: Record<string, unknown> = {};
        if (server.packages && server.packages.length > 0) {
          const pkg = server.packages[0];
          if (pkg.registryType === 'npm') {
            mcpConfig.command = 'npx';
            mcpConfig.args = ['-y', pkg.identifier];
          } else if (pkg.registryType === 'pip' || pkg.registryType === 'pypi') {
            mcpConfig.command = 'uvx';
            mcpConfig.args = [pkg.identifier];
          }

          // Add environment variables info
          if (pkg.environmentVariables && pkg.environmentVariables.length > 0) {
            mcpConfig.env = pkg.environmentVariables.reduce((acc, env) => {
              acc[env.name] = `<${env.description || env.name}>`;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Handle remotes (SSE/streamable endpoints)
        if (server.remotes && server.remotes.length > 0) {
          const remote = server.remotes[0];
          mcpConfig.url = remote.url;
          mcpConfig.transport = remote.type;
        }

        return {
          name: server.name,
          description: server.description || 'No description available',
          mcp: { [server.name]: mcpConfig },
          stargazer_count: 0, // Registry doesn't provide star counts
          by: owner,
          isEnabled: false,
          avatar_url: avatarUrl,
        };
      });

      const result: RegistryFetchResult = {
        servers,
        nextCursor: data.metadata.nextCursor,
        totalCount: data.metadata.count,
      };

      // Store in cache
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Error fetching from MCP Registry:', error);
      return {
        servers: [],
        nextCursor: undefined,
        totalCount: 0,
      };
    }
  }

  /**
   * Search servers in the MCP Registry
   */
  static async searchServers(query: string, limit: number = 50): Promise<RegistryFetchResult> {
    return this.fetchServers({ search: query, limit });
  }
}
