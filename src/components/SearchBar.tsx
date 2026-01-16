import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSearchQuery } from '@/store/slices/serverSlice';
import { selectSearchQuery } from '@/store/selectors/serverSelectors';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [localValue, setLocalValue] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(localValue));
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, dispatch]);

  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search..."
        value={localValue}
        onChange={handleSearchChange}
        className="h-6 w-full border border-border bg-card pl-7 pr-2 text-[10px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}
