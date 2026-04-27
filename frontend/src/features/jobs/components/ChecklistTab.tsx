import { IconCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import {
  useChecklistItems,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from '../hooks/useChecklists';

interface Props {
  jobId: string;
}

export const ChecklistTab = ({ jobId }: Props) => {
  const { data: items = [], isLoading } = useChecklistItems(jobId);
  const createItem = useCreateChecklistItem(jobId);
  const updateItem = useUpdateChecklistItem(jobId);
  const deleteItem = useDeleteChecklistItem(jobId);

  const [newTitle, setNewTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const completed = items.filter((i) => i.isCompleted).length;
  const total = items.length;

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    createItem.mutate(title, {
      onSuccess: () => {
        setNewTitle('');
        inputRef.current?.focus();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="col-12">
        <div className="card">
          <div className="card-body text-muted">Loading checklist…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h3 className="card-title mb-0">
            Checklist
            {total > 0 && (
              <span className="ms-2 text-muted fw-normal fs-5">
                — {completed}/{total} done
              </span>
            )}
          </h3>
          {total > 0 && (
            <div className="progress w-25" style={{ height: 6 }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${Math.round((completed / total) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Add item input */}
        <div className="card-body border-bottom py-2">
          <div className="input-group input-group-sm">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Add checklist item…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={createItem.isPending || !newTitle.trim()}
            >
              <IconPlus size={14} className="me-1" />
              Add
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card-body">
            <EmptyState
              icon={<IconCheck size={40} className="text-muted" />}
              title="No checklist items"
              description="Add tasks that need to be completed for this job."
            />
          </div>
        ) : (
          <ul className="list-group list-group-flush">
            {[...items]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <li
                  key={item.id}
                  className="list-group-item d-flex align-items-center gap-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="form-check-input flex-shrink-0"
                    checked={item.isCompleted}
                    onChange={() =>
                      updateItem.mutate({
                        id: item.id,
                        payload: { isCompleted: !item.isCompleted },
                      })
                    }
                  />
                  <span
                    className={`flex-grow-1 ${item.isCompleted ? 'text-muted text-decoration-line-through' : ''}`}
                  >
                    {item.title}
                  </span>
                  <button
                    className="btn btn-ghost-danger btn-sm btn-icon ms-auto"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <IconTrash size={14} />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete checklist item?"
        body="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteItem.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
