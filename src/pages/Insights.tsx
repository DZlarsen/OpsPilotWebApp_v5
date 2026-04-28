import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recommendation } from '@/data/mock-data';
import { useBusiness } from '@/contexts/BusinessContext';
import StatusBadge from '@/components/shared/StatusBadge';
import { Lightbulb, ArrowRight, CheckCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Insights() {
  const { recommendations, processes, owners, activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const [recList, setRecList] = useState<Recommendation[]>(recommendations);
  useEffect(() => { setRecList(recommendations); }, [activeBusiness.id]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [notes, setNotes] = useState('');

  const sorted = [...recList].sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });

  const openReview = (rec: Recommendation) => {
    setSelectedRec(rec);
    setNotes('');
    setReviewOpen(true);
  };

  const handleMarkReviewed = () => {
    if (!selectedRec) return;
    setRecList(prev => prev.map(r => r.id === selectedRec.id ? { ...r, status: 'reviewed' } : r));
    setReviewOpen(false);
    toast.success(`"${selectedRec.title}" marked as reviewed`);
  };

  const handleAssignTask = () => {
    if (!selectedRec) return;
    // Store the recommendation context so TaskTracking can pre-populate a new task
    sessionStorage.setItem('newTaskPrefill', JSON.stringify({
      title: `[Insight] ${selectedRec.title}`,
      description: selectedRec.description,
      priority: selectedRec.priority === 'high' ? 'high' : selectedRec.priority === 'medium' ? 'medium' : 'low',
      tags: ['Insight', selectedRec.category],
    }));
    setReviewOpen(false);
    navigate('/tasks');
    toast.success('Opening Kanban board — pre-filled with this recommendation');
  };

  const handleImplement = () => {
    if (!selectedRec) return;
    setRecList(prev => prev.map(r => r.id === selectedRec.id ? { ...r, status: 'implemented' } : r));
    setReviewOpen(false);
    toast.success(`"${selectedRec.title}" marked as implemented`);
  };

  const handleDismiss = () => {
    if (!selectedRec) return;
    setRecList(prev => prev.filter(r => r.id !== selectedRec.id));
    setReviewOpen(false);
    toast('Recommendation dismissed');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">17</span>
            <span className="page-eyebrow">Taskmaster · Insights</span>
          </div>
          <h1 className="page-title">Continuous Improvement Insights</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">AI-assisted recommendations based on process data analysis</p>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">{recList.filter(r => r.status === 'new').length} new</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{recList.filter(r => r.status === 'reviewed').length} reviewed</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{recList.filter(r => r.status === 'implemented').length} implemented</span>
      </div>

      <div className="grid gap-4">
        {sorted.map((rec) => {
          const process = processes.find(p => p.id === rec.processId);
          return (
            <div key={rec.id} className="kpi-card">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                  rec.priority === 'high' ? 'bg-status-critical/10' : rec.priority === 'medium' ? 'bg-status-warning/10' : 'bg-status-ok/10'
                }`}>
                  <Lightbulb className={`h-4 w-4 ${
                    rec.priority === 'high' ? 'text-status-critical' : rec.priority === 'medium' ? 'text-status-warning' : 'text-status-ok'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold">{rec.title}</h3>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {process?.name.split('—')[0].trim()}
                    </span>
                    <span>{rec.category}</span>
                    <StatusBadge
                      status={rec.priority === 'high' ? 'critical' : rec.priority === 'medium' ? 'warning' : 'ok'}
                      label={`${rec.priority} priority`}
                    />
                  </div>
                </div>
                <button
                  onClick={() => openReview(rec)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex-shrink-0"
                >
                  {rec.status === 'implemented' ? <CheckCircle className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                  {rec.status === 'implemented' ? 'Done' : 'Review'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          {selectedRec && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRec.title}</DialogTitle>
                <DialogDescription>Review this recommendation and take action.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge
                    status={selectedRec.priority === 'high' ? 'critical' : selectedRec.priority === 'medium' ? 'warning' : 'ok'}
                    label={`${selectedRec.priority} priority`}
                  />
                  <StatusBadge status={selectedRec.status} />
                  <span className="text-xs text-muted-foreground">{selectedRec.category}</span>
                </div>

                <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedRec.description}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes / Action Plan</label>
                  <textarea
                    className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    rows={3}
                    placeholder="Add notes about your review, planned actions, or findings..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assign To</label>
                  <select className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    {owners.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mr-auto"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAssignTask}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Assign Task
                </button>
                <button
                  onClick={handleMarkReviewed}
                  className="px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={handleImplement}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Mark Implemented
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
