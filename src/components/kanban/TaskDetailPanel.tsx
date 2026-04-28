import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  X, User, Calendar, MessageSquare, Send, Trash2, Tag, Clock, AlertTriangle,
  Bug, ClipboardCheck, Sparkles, FileText, CheckSquare,
} from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { Task, TaskStatus, Priority, TaskType, owners, processOptions, columns, taskTypes, defaultEightDSteps, defaultFiveSScores } from './types';
import { toast } from 'sonner';
import EightDTracker from './EightDTracker';
import FiveSScorecard from './FiveSScorecard';
import SubtaskList from './SubtaskList';

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const typeIcons: Record<TaskType, typeof Bug> = {
  task: CheckSquare,
  bug: Bug,
  '8d-report': FileText,
  '5s-audit': ClipboardCheck,
  improvement: Sparkles,
};

export default function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: Props) {
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
  const taskType = task.type || 'task';
  const TypeIcon = typeIcons[taskType];

  const update = (partial: Partial<Task>) => onUpdate({ ...task, ...partial });

  const updateWithLog = (partial: Partial<Task>, message: string) => {
    const logEntry = {
      id: `sys-${Date.now()}`,
      author: 'System',
      text: message,
      timestamp: new Date().toISOString(),
      system: true,
    };
    onUpdate({ ...task, ...partial, comments: [...task.comments, logEntry] });
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: 'Ops Manager',
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    update({ comments: [...task.comments, newComment] });
    setCommentText('');
    toast.success('Comment added');
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    const oldLabel = columns.find(c => c.id === task.status)?.label;
    const newLabel = columns.find(c => c.id === newStatus)?.label;
    updateWithLog({ status: newStatus }, `Status changed from ${oldLabel} → ${newLabel}`);
  };

  const handlePriorityChange = (newPriority: Priority) => {
    updateWithLog({ priority: newPriority }, `Priority changed from ${task.priority} → ${newPriority}`);
  };

  const handleOwnerChange = (newOwner: string) => {
    updateWithLog({ owner: newOwner }, `Assignee changed from ${task.owner} → ${newOwner}`);
  };

  const selectClass = 'bg-secondary/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="fixed inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col h-full rounded-tl-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{task.key}</span>
          <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary ${taskTypes.find(t => t.id === taskType)?.color || 'text-foreground'}`}>
            <TypeIcon className="h-3 w-3" />
            {taskTypes.find(t => t.id === taskType)?.label}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Title */}
          {editing === 'title' ? (
            <input
              autoFocus
              className="w-full text-lg font-bold bg-transparent border-b border-primary outline-none py-1"
              defaultValue={task.title}
              onBlur={(e) => { update({ title: e.target.value || task.title }); setEditing(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
          ) : (
            <h2 className="text-lg font-bold cursor-pointer hover:text-primary transition-colors" onClick={() => setEditing('title')}>
              {task.title}
            </h2>
          )}

          {overdue && (
            <div className="flex items-center gap-2 text-xs font-semibold text-status-critical bg-status-critical/10 px-3 py-2 rounded-md">
              <Clock className="h-3.5 w-3.5" /> This task is overdue
            </div>
          )}

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <select className={selectClass + ' w-full'} value={task.status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
              <select className={selectClass + ' w-full'} value={task.priority} onChange={(e) => handlePriorityChange(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
              <select className={selectClass + ' w-full'} value={task.owner} onChange={(e) => handleOwnerChange(e.target.value)}>
                {owners.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Process</label>
              <select className={selectClass + ' w-full'} value={task.process} onChange={(e) => update({ process: e.target.value })}>
                {processOptions.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
              <input type="date" className={selectClass + ' w-full'} value={task.dueDate} onChange={(e) => update({ dueDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Created</label>
              <p className="text-sm text-muted-foreground py-1.5">{task.createdAt}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            {editing === 'description' ? (
              <textarea
                autoFocus
                className="w-full rounded-md bg-secondary/50 border border-border px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={4}
                defaultValue={task.description}
                onBlur={(e) => { update({ description: e.target.value }); setEditing(null); }}
              />
            ) : (
              <p className="text-sm text-foreground/80 cursor-pointer hover:bg-secondary/30 rounded-md p-2 -m-2 transition-colors" onClick={() => setEditing('description')}>
                {task.description || 'Click to add description...'}
              </p>
            )}
          </div>

          {/* 8D Tracker */}
          {taskType === '8d-report' && (
            <EightDTracker
              steps={task.eightDSteps || defaultEightDSteps}
              onUpdate={(steps) => update({ eightDSteps: steps })}
            />
          )}

          {/* 5S Scorecard */}
          {taskType === '5s-audit' && (
            <FiveSScorecard
              scores={task.fiveSScores || defaultFiveSScores}
              onUpdate={(scores) => update({ fiveSScores: scores })}
            />
          )}

          {/* Subtasks / Checklist */}
          <SubtaskList
            subtasks={task.subtasks || []}
            onUpdate={(subtasks) => update({ subtasks })}
          />

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3 w-3" /> Labels
            </label>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded-md text-xs bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
              {task.tags.length === 0 && <span className="text-xs text-muted-foreground">No labels</span>}
            </div>
          </div>

          {/* Activity / Comments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Activity ({task.comments.length})
              </label>
            </div>

            {task.comments.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No comments yet</p>
            )}

            {task.comments.map(comment => (
              <div key={comment.id} className={`flex gap-3 ${comment.system ? 'opacity-60' : ''}`}>
                {comment.system ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex-shrink-0 mt-0.5">
                    {comment.author.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${comment.system ? 'italic text-muted-foreground' : ''}`}>{comment.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(comment.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${comment.system ? 'text-muted-foreground italic text-xs' : 'text-foreground/80'}`}>{comment.text}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex gap-2 pt-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary flex-shrink-0 mt-1">
                OP
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 rounded-md bg-secondary/50 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                />
                <button
                  onClick={addComment}
                  disabled={!commentText.trim()}
                  className="h-9 w-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
