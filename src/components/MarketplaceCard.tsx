import { Server, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerData } from '@/types/mcp';
import { formatStars } from '@/utils/commonFunctions';

interface MarketplaceCardProps {
  server: ServerData;
  view: 'grid' | 'list';
  index: number;
  onInstall: () => void;
}

export default function MarketplaceCard({
  server,
  view,
  index,
  onInstall,
}: MarketplaceCardProps) {
  const { name, description, by, stargazer_count, avatar_url } = server;
  const animationDelay = `${index * 50}ms`;

  const handleInstall = () => {
    onInstall();
  };

  if (view === 'list') {
    return (
      <div
        className="border border-border bg-card p-2 transition-all hover:border-primary/50 animate-fade-in"
        style={{ animationDelay }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-muted">
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={`${name} avatar`}
                className="h-6 w-6 object-cover"
              />
            ) : (
              <Server className="h-3 w-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-foreground">{name}</h3>
            <p className="text-[10px] text-muted-foreground truncate">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{by}</span>
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />
                <span>{formatStars(stargazer_count)}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px]"
              onClick={handleInstall}
            >
              <Plus className="h-3 w-3 mr-1" />
              Install
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border border-border bg-card p-3 transition-all hover:border-primary/50 animate-fade-in"
      style={{ animationDelay }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-muted">
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={`${name} avatar`}
                className="h-7 w-7 object-cover"
              />
            ) : (
              <Server className="h-4 w-4" />
            )}
          </div>
          <h3 className="text-xs font-semibold text-foreground break-words">{name}</h3>
        </div>
      </div>

      <p className="mb-2 text-[10px] text-muted-foreground break-words whitespace-pre-wrap">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{by}</span>
          <div className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5" />
            <span>{formatStars(stargazer_count)}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={handleInstall}
        >
          <Plus className="h-3 w-3 mr-1" />
          Install
        </Button>
      </div>
    </div>
  );
}
