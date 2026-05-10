import type { SortDirection } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

interface SortIndicatorProps {
  direction: SortDirection | false;
}

export function SortIndicator({ direction }: SortIndicatorProps) {
  if (direction === 'asc') return <ArrowUp className="h-3 w-3" aria-hidden="true" />;
  if (direction === 'desc') return <ArrowDown className="h-3 w-3" aria-hidden="true" />;
  return <ChevronsUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />;
}
