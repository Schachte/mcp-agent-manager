import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import ServerCard from '../ServerCard';
import { useMcpService } from '@/hooks/useMcpService';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setServers, toggleServer } from '@/store/slices/serverSlice';
import { selectAllServers, selectSearchQuery, selectServersLoading, selectSortBy } from '@/store/selectors/serverSelectors';

interface ServerListProps {
  view: 'grid' | 'list';
}

// Memoized filtering function
const filterServers = (servers: any[], query: string) => {
  if (!Array.isArray(servers) || !query) return servers || [];
  
  const lowerQuery = query.toLowerCase().trim();
  return servers.filter((server) => {
    const nameMatch = server.name?.toLowerCase().includes(lowerQuery) || false;
    const byMatch = server.by?.toLowerCase().includes(lowerQuery) || false;
    return nameMatch || byMatch;
  });
};

// Memoized sorting function
const sortServers = (servers: any[], sortBy: string) => {
  // Ensure servers is an array
  if (!Array.isArray(servers)) return [];
  
  const serversCopy = [...servers];
  
  switch (sortBy) {
    case 'name':
      return serversCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'status':
      return serversCopy.sort((a, b) => {
        const statusA = a.isEnabled ? 1 : 0;
        const statusB = b.isEnabled ? 1 : 0;
        return statusB - statusA; // Enabled first
      });
    case 'stars':
      return serversCopy.sort((a, b) => b.stargazer_count - a.stargazer_count);
    default:
      return serversCopy;
  }
};

export default function ServerList({ view }: ServerListProps) {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectAllServers);
  console.log("🚀 ~ ServerList ~ servers:", servers)
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(selectSortBy);
  const isLoadingFromStore = useAppSelector(selectServersLoading);
  const { getServers, isLoading, isInstalled } = useMcpService();

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
      if (!isInstalled) return;
      
      const result = await getServers();
      console.log('🚀 ~ fetchServers ~ result:', result);
      
        const serversArray = Array.isArray(result) ? result : [];
        dispatch(setServers(serversArray));
    };

    fetchServers();
  }, [isInstalled, dispatch]);

  const handleToggle = (name: string) => {
    dispatch(toggleServer(name));
  };

  if (isLoading || isLoadingFromStore) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      {sortedServers.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">No servers found</p>
        </div>
      ) : (
        <div
          className={cn(
            'gap-4',
            view === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2' : 'flex flex-col'
          )}
        >
          {sortedServers.map((server, index) => (
            <ServerCard
              key={Object.keys(server.mcp)[0] || server.name}
              name={server.name}
              description={server.description}
              by={server.by}
              stargazer_count={server.stargazer_count}
              mcp={server.mcp}
              isEnabled={server.isEnabled}
              view={view}
              index={index}
              onToggle={() => handleToggle(server.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}