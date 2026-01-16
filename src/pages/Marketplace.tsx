import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useMcpService } from '@/hooks/useMcpService';
import { ServerData } from '@/types/mcp';
import { filterServers, sortServers } from '@/utils/commonFunctions';
import { Skeleton } from '@/components/ui/skeleton';
import { ReusablePagination } from '@/components/Pagination';
import MarketplaceCard from '@/components/MarketplaceCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { McpRegistryService } from '@/services/mcpRegistryService';
import InstallToAgentDialog from '@/components/InstallToAgentDialog';

const CLI_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

// CLI cache stored outside component to persist across remounts
let cliCache: { servers: ServerData[]; timestamp: number } | null = null;

const Marketplace = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [cliServers, setCliServers] = useState<ServerData[]>([]);
  const [registryServers, setRegistryServers] = useState<ServerData[]>([]);
  const [registryCursor, setRegistryCursor] = useState<string | undefined>();
  const [hasMoreRegistry, setHasMoreRegistry] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stars'>('stars');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [serverToInstall, setServerToInstall] = useState<string>('');
  const itemsPerPage = 12;
  const isInitialMount = useRef(true);

  const { getServers, addServerByAgent, isInstalled } = useMcpService();

  // Load servers with caching
  const fetchServers = useCallback(async (skipCache = false) => {
    const isRefresh = !isInitialMount.current;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch from CLI (tuff-mcp-manager) - with caching
      let cliResults: ServerData[] = [];
      const now = Date.now();
      const cliCacheValid = cliCache && (now - cliCache.timestamp < CLI_CACHE_TTL_MS);

      if (!skipCache && cliCacheValid && isInstalled) {
        cliResults = cliCache!.servers;
      } else if (isInstalled) {
        const result = await getServers(false);
        if (result) {
          cliResults = result;
          cliCache = { servers: result, timestamp: now };
        }
      }
      setCliServers(cliResults);

      // Fetch from MCP Registry (has its own internal cache)
      const registryResult = await McpRegistryService.fetchServers({
        limit: 50,
        search: searchQuery || undefined,
        skipCache,
      });

      // Filter out duplicates (servers that exist in CLI results)
      const cliNames = new Set(cliResults.map(s => s.name.toLowerCase()));
      const uniqueRegistryServers = registryResult.servers.filter(
        s => !cliNames.has(s.name.toLowerCase())
      );

      setRegistryServers(uniqueRegistryServers);
      setRegistryCursor(registryResult.nextCursor);
      setHasMoreRegistry(!!registryResult.nextCursor);

      // Update last updated time
      const registryLastFetch = McpRegistryService.getLastFetchTime();
      setLastUpdated(registryLastFetch || (cliCache?.timestamp ?? null));
    } catch (error) {
      console.error('Error fetching marketplace servers:', error);
    }

    setIsLoading(false);
    setIsRefreshing(false);
    isInitialMount.current = false;
  }, [isInstalled, getServers, searchQuery]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    // Clear caches
    cliCache = null;
    McpRegistryService.clearCache();
    // Refetch with skipCache
    fetchServers(true);
  }, [fetchServers]);

  // Load initial servers from both sources
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Load more registry servers when needed
  const loadMoreRegistryServers = useCallback(async () => {
    if (!hasMoreRegistry || isLoadingMore || !registryCursor) return;

    setIsLoadingMore(true);
    try {
      const registryResult = await McpRegistryService.fetchServers({
        limit: 50,
        cursor: registryCursor,
        search: searchQuery || undefined,
      });

      // Filter out duplicates
      const existingNames = new Set([
        ...cliServers.map(s => s.name.toLowerCase()),
        ...registryServers.map(s => s.name.toLowerCase()),
      ]);
      const uniqueNewServers = registryResult.servers.filter(
        s => !existingNames.has(s.name.toLowerCase())
      );

      setRegistryServers(prev => [...prev, ...uniqueNewServers]);
      setRegistryCursor(registryResult.nextCursor);
      setHasMoreRegistry(!!registryResult.nextCursor);
    } catch (error) {
      console.error('Error loading more registry servers:', error);
    }
    setIsLoadingMore(false);
  }, [hasMoreRegistry, isLoadingMore, registryCursor, searchQuery, cliServers, registryServers]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Combined servers: CLI first, then Registry
  const allServers = useMemo(() => {
    return [...cliServers, ...registryServers];
  }, [cliServers, registryServers]);

  // Memoized filtering
  const filteredServers = useMemo(() => {
    return filterServers(allServers, searchQuery);
  }, [allServers, searchQuery]);

  // Memoized sorting
  const sortedServers = useMemo(() => {
    return sortServers(filteredServers, sortBy);
  }, [filteredServers, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedServers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServers = sortedServers.slice(startIndex, endIndex);

  // Load more when approaching end of current results
  useEffect(() => {
    const remainingServers = sortedServers.length - endIndex;
    if (remainingServers < itemsPerPage * 2 && hasMoreRegistry && !isLoadingMore) {
      loadMoreRegistryServers();
    }
  }, [currentPage, sortedServers.length, endIndex, hasMoreRegistry, isLoadingMore, loadMoreRegistryServers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInstallClick = (serverName: string) => {
    setServerToInstall(serverName);
    setInstallDialogOpen(true);
  };

  const handleInstallToAgent = async (agentId: string) => {
    await addServerByAgent(agentId, serverToInstall.toLowerCase());
  };

  if (isLoading) {
    return (
      <>
        <MarketplaceHeader
          view={view}
          setView={setView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalCount={0}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div
            className={cn(
              'gap-2',
              view === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            )}
          >
            {[...Array(itemsPerPage)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MarketplaceHeader
        view={view}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalCount={sortedServers.length}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 pb-16">
        {sortedServers.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-xs">No servers found</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'gap-2',
                view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col'
              )}
            >
              {paginatedServers.map((server, index) => (
                <MarketplaceCard
                  key={`${server.name}-${server.by}`}
                  view={view}
                  index={index}
                  server={server}
                  onInstall={() => handleInstallClick(server.name)}
                />
              ))}
            </div>
            {isLoadingMore && (
              <div className="mt-2 flex justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading more servers...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed pagination at bottom */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center py-3 bg-background/80 backdrop-blur-sm border-t border-border">
          <ReusablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <InstallToAgentDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        serverName={serverToInstall}
        onInstall={handleInstallToAgent}
      />
    </>
  );
};

export default Marketplace;
