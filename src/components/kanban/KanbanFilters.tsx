import { Search, Filter, X } from 'lucide-react';
import { TaskType, taskTypes } from './types';
import { useBusiness } from '@/contexts/BusinessContext';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  processFilter: string;
  onProcessFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
}

export default function KanbanFilters({
  search, onSearchChange,
  ownerFilter, onOwnerFilterChange,
  priorityFilter, onPriorityFilterChange,
  processFilter, onProcessFilterChange,
  typeFilter, onTypeFilterChange,
}: Props) {
  const { owners, processOptions } = useBusiness();
  const selectClass = 'bg-secondary/50 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const hasFilters = search || ownerFilter || priorityFilter || processFilter || typeFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          className="w-full rounded-md bg-secondary/50 border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <select className={selectClass} value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
        <option value="">All Types</option>
        {taskTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      <select className={selectClass} value={ownerFilter} onChange={(e) => onOwnerFilterChange(e.target.value)}>
        <option value="">All Assignees</option>
        {owners.map(o => <option key={o}>{o}</option>)}
      </select>

      <select className={selectClass} value={priorityFilter} onChange={(e) => onPriorityFilterChange(e.target.value)}>
        <option value="">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select className={selectClass} value={processFilter} onChange={(e) => onProcessFilterChange(e.target.value)}>
        <option value="">All Processes</option>
        {processOptions.map(p => <option key={p}>{p}</option>)}
      </select>

      {hasFilters && (
        <button
          onClick={() => { onSearchChange(''); onOwnerFilterChange(''); onPriorityFilterChange(''); onProcessFilterChange(''); onTypeFilterChange(''); }}
          className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/50 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
