import { LayoutGrid, List, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface MarketplaceHeaderProps {
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'name' | 'stars';
  setSortBy: (sort: 'name' | 'stars') => void;
  totalCount: number;
  onRefresh?: () => void;
  lastUpdated?: number | null;
  isRefreshing?: boolean;
}

function formatLastUpdated(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ago`;
}

export default function MarketplaceHeader({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  totalCount,
  onRefresh,
  lastUpdated,
  isRefreshing,
}: MarketplaceHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold">MCP Marketplace</h1>
          <p className="text-[10px] text-muted-foreground">
            {totalCount} servers available
            {lastUpdated && ` • Updated ${formatLastUpdated(lastUpdated)}`}
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh servers"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end ml-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search MCPs..."
            className="h-7 w-full pl-7 text-xs"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'stars')}>
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Stars</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border border-border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setView('list')}
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </header>
  );
}
