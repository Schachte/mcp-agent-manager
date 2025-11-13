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
} from '@/store/selectors/serverSelectors';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { ServerData } from '@/types/mcp';
import { filterServers, sortServers } from '@/utils/commonFunctions';
import { ONE_HOUR_MS } from '@/utils/constants';
import { Skeleton } from '@/components/ui/skeleton';

type ServerListProps = {
  view: 'grid' | 'list';
};

export default function ServerList({ view }: ServerListProps) {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectAllServers);
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(selectSortBy);
  const lastFetched = useAppSelector(state => state.server.lastFetched);
  const activeAgent = useActiveAgent();
  const projectLocation = useAppSelector(selectProjectLocation);
  const {
    getServers,
    getServersByAgent,
    addServerByAgent,
    removeServerByAgent,
    isInstalled,
  } = useMcpService();

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Memoized filtering
  const filteredServers = useMemo(() => {
    return filterServers(servers, searchQuery);
  }, [servers, searchQuery]);

  // Memoized sorting
  const sortedServers = useMemo(() => {
    return sortServers(filteredServers, sortBy);
  }, [filteredServers, sortBy]);

  useEffect(() => {
    const fetchServers = async () => {
      if (!isInstalled) {
        setIsInitialLoading(false);
        return;
      }

      setIsInitialLoading(true);

      const now = Date.now();
      const isStale = !lastFetched || now - lastFetched > ONE_HOUR_MS;

      // Only fetch agent servers if activeAgent is available
      let agentServers = null;
      if (activeAgent?.agent) {
        agentServers = await getServersByAgent(
          activeAgent.agent,
          projectLocation
        );
      }

      // Only fetch all servers if data is stale
      if (isStale || servers.length === 0) {
        const result = await getServers();
        const serversArray = result?.map((server: ServerData) => {
          return {
            ...server,
            isEnabled: agentServers?.some(
              agentServer => agentServer.name === server.name
            ),
          };
        });
        await dispatch(setServers(serversArray || []));
      } else {
        // Update enabled status on cached servers
        const updatedServers = servers.map(server => ({
          ...server,
          isEnabled: agentServers?.some(
            agentServer => agentServer.name === server.name
          ),
        }));
        await dispatch(setServers(updatedServers));
      }

      setIsInitialLoading(false);
    };

    fetchServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstalled, activeAgent?.agent, projectLocation]);

  if (isInitialLoading) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <div
          className={cn(
            'gap-4',
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          )}
        >
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
      {sortedServers.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">No servers found</p>
        </div>
      ) : (
        <div
          className={cn(
            'gap-4',
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          )}
        >
          {sortedServers.map((server, index) => (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
