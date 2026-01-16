import { Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          'flex h-5 w-5 items-center justify-center transition-colors cursor-pointer',
          view === 'grid'
            ? 'bg-muted-foreground/20 text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <Grid3x3 className="h-2.5 w-2.5" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          'flex h-5 w-5 items-center justify-center transition-colors cursor-pointer',
          view === 'list'
            ? 'bg-muted-foreground/20 text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <List className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
