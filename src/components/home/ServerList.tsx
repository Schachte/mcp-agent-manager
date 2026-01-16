import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import ServerCard from '../ServerCard';
import { useMcpService } from '@/hooks/useMcpService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setServers } from '@/store/slices/serverSlice';
import {
  selectAllServers,
  selectProjectLocation,
  selectSearchQuery,
  selectSortBy,
  selectShowAllServers,
} from '@/store/selectors/serverSelectors';
import { selectActiveAgentConfigPath } from '@/store/selectors/agentSelectors';
import { ServerData } from '@/types/mcp';
import { filterServers, sortServers } from '@/utils/commonFunctions';
import { ReusablePagination } from '@/components/Pagination';
import { Loader2 } from 'lucide-react';
import { AgentConfigService } from '@/services/agentConfigService';

type ServerListProps = {
  view: 'grid' | 'list';
};

export default function ServerList({ view }: ServerListProps) {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectAllServers);
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(selectSortBy);
  const showAllServers = useAppSelector(selectShowAllServers);
  const activeAgentConfigPath = useAppSelector(selectActiveAgentConfigPath);
  const projectLocation = useAppSelector(selectProjectLocation);
  const {
    addServerByAgent,
    removeServerByAgent,
  } = useMcpService();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [_isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const itemsPerPage = 9;

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Memoized filtering
  const filteredServers = useMemo(() => {
    return filterServers(servers, searchQuery);
  }, [servers, searchQuery]);

  // Memoized sorting - preserve config order for agent view
  const sortedServers = useMemo(() => {
    return sortServers(filteredServers, sortBy, { preserveConfigOrder: true });
  }, [filteredServers, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedServers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServers = showAllServers
    ? sortedServers
    : sortedServers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  useEffect(() => {
    const fetchServers = async () => {
      if (!activeAgentConfigPath) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
        dispatch(setServers([]));
        return;
      }

      // Only show loading skeleton on initial load when there are no servers
      const hasExistingServers = servers.length > 0;
      if (hasExistingServers) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        // Load servers directly from the agent's config file
        const configResult = await AgentConfigService.listMcpsInConfig(activeAgentConfigPath);

        if (configResult.success && configResult.mcps) {
          const mcpEntries = Object.entries(configResult.mcps);
          const serversList: ServerData[] = mcpEntries.map(([name, config]) => {
            // Build description based on available fields
            let description = '';
            if (config.command) {
              description = `${config.command}${config.args ? ' ' + config.args.join(' ') : ''}`;
            } else if (config.url) {
              description = `URL: ${config.url}`;
            } else if (config.type) {
              description = `Type: ${config.type}`;
            }

            return {
              name,
              description: description || 'No configuration details',
              mcp: { [name]: config },
              stargazer_count: 0,
              by: 'Local Config',
              isEnabled: true,
              avatar_url: '',
            };
          });
          await dispatch(setServers(serversList));
        } else {
          await dispatch(setServers([]));
        }
      } catch (error) {
        console.error('Error loading servers from config:', error);
        await dispatch(setServers([]));
      }

      setIsInitialLoading(false);
      setIsRefreshing(false);
    };

    fetchServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAgentConfigPath, refreshTrigger]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the server list when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 pb-16">
        {sortedServers.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No servers found</p>
          </div>
        ) : (
          <div
            className={cn(
              'gap-2',
              view === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            )}
          >
            {paginatedServers.map((server, index) => (
              <ServerCard
                key={Object.keys(server.mcp)[0] || server.name}
                view={view}
                index={index}
                server={server}
                addServerByAgent={(agent: string, serverName: string) =>
                  addServerByAgent(agent, serverName, projectLocation)
                }
                removeServerByAgent={(serverName: string, agent: string) =>
                  removeServerByAgent(serverName, agent, projectLocation)
                }
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed pagination at bottom */}
      {!showAllServers && totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center py-3 bg-background/80 backdrop-blur-sm border-t border-border">
          <ReusablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
