import SearchBar from '@/components/SearchBar';
import ViewToggle from '@/components/ViewToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSortBy, setShowAllServers } from '@/store/slices/serverSlice';
import { selectSortBy, selectShowAllServers } from '@/store/selectors/serverSelectors';
import { useMcpService } from '@/hooks/useMcpService';
import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import AgentIcon from '../AgentIcon';

interface HeaderProps {
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
}

export default function Header({ view, setView }: HeaderProps) {
  const dispatch = useAppDispatch();
  const activeAgent = useActiveAgent();
  const reduxSortBy = useAppSelector(selectSortBy);
  const showAllServers = useAppSelector(selectShowAllServers);
  const [localSortBy, setLocalSortBy] = useState(reduxSortBy);
  const { isInstalled, isInstalling, installCli } = useMcpService();

  const handleShowAllToggle = (checked: boolean) => {
    dispatch(setShowAllServers(checked));
  };

  // Sync local state with Redux state
  useEffect(() => {
    setLocalSortBy(reduxSortBy);
  }, [reduxSortBy]);

  // Update Redux state when local state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSortBy(localSortBy));
    }, 300);

    return () => clearTimeout(timer);
  }, [localSortBy, dispatch]);

  const handleSortChange = (value: string) => {
    setLocalSortBy(value);
  };

  return (
    <header className="border-b border-border px-3 py-1.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <AgentIcon agent={activeAgent} className="h-4 w-4 shrink-0" />
          <h1 className="text-xs font-semibold truncate">
            {activeAgent?.name || 'MCP'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {!isInstalled && !activeAgent && (
            <Button
              onClick={installCli}
              disabled={isInstalling}
              variant="default"
              size="sm"
              className="h-6 text-[10px] rounded-none px-2"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="mr-1 h-3 w-3" />
                  Install CLI
                </>
              )}
            </Button>
          )}
          <SearchBar className="flex-1" />
          <Select value={localSortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-6 w-20 text-[10px] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Switch
              id="show-all"
              checked={showAllServers}
              onCheckedChange={handleShowAllToggle}
            />
            <Label htmlFor="show-all" className="text-[10px] text-muted-foreground cursor-pointer">
              All
            </Label>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
