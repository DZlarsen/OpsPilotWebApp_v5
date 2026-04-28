import { useState } from 'react';
import { Plus, CheckCircle2, Circle, X } from 'lucide-react';
import { Subtask } from './types';

interface Props {
  subtasks: Subtask[];
  onUpdate: (subtasks: Subtask[]) => void;
}

export default function SubtaskList({ subtasks, onUpdate }: Props) {
  const [newText, setNewText] = useState('');
  const completedCount = subtasks.filter(s => s.completed).length;
  const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const addSubtask = () => {
    if (!newText.trim()) return;
    onUpdate([...subtasks, { id: `sub-${Date.now()}`, text: newText.trim(), completed: false }]);
    setNewText('');
  };

  const toggleSubtask = (id: string) => {
    onUpdate(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    onUpdate(subtasks.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Checklist
        </label>
        {subtasks.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">{completedCount}/{subtasks.length}</span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
          <div
            className="h-full bg-status-ok transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map(sub => (
          <div key={sub.id} className="flex items-center gap-2 group py-0.5">
            <button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">
              {sub.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-ok" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </button>
            <span className={`text-xs flex-1 ${sub.completed ? 'line-through text-muted-foreground' : ''}`}>
              {sub.text}
            </span>
            <button
              onClick={() => removeSubtask(sub.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          className="flex-1 rounded-md bg-secondary/50 border border-border px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Add checklist item..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
        />
        <button
          onClick={addSubtask}
          disabled={!newText.trim()}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
