import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSend, IconTrash } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { messagesApi, type Message } from '../../../api/messages';
import { ConfirmModal } from '../../../components/ConfirmModal';

interface Props {
  jobId: string;
}

export function MessagesTab({ jobId }: Props) {
  const qc = useQueryClient();
  const key = ['messages', jobId];
  const { data: messages = [], isLoading } = useQuery({ queryKey: key, queryFn: () => messagesApi.list(jobId) });
  const sendMutation = useMutation({
    mutationFn: (body: string) => messagesApi.send(jobId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setText(''); },
    onError: () => toast.error('Failed to send message'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => messagesApi.delete(jobId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Failed to delete message'),
  });

  const [text, setText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  };

  return (
    <>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete message"
        body="Delete this message? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="d-flex flex-column" style={{ height: '420px' }}>
        {/* Thread */}
        <div className="flex-grow-1 overflow-auto p-3" style={{ background: 'var(--tblr-bg-surface-secondary, #f6f8fb)', borderRadius: 8 }}>
          {isLoading ? (
            <div className="text-center text-secondary py-4">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-secondary py-4">
              No messages yet. Send one below — your client will be notified by email.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`d-flex mb-3 ${m.senderType === 'contractor' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`position-relative rounded p-3 ${m.senderType === 'contractor' ? 'bg-primary text-white' : 'bg-white border'}`}
                  style={{ maxWidth: '75%', wordBreak: 'break-word' }}
                >
                  <div className="fw-semibold small mb-1 opacity-75">{m.senderName}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                  <div className="d-flex align-items-center justify-content-between mt-1 gap-2">
                    <span className={`small opacity-50 ${m.senderType === 'contractor' ? 'text-white' : 'text-secondary'}`}>
                      {new Date(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {m.emailSent && ' · emailed'}
                    </span>
                    {m.senderType === 'contractor' && (
                      <button
                        className="btn btn-sm p-0 border-0 opacity-50"
                        style={{ color: 'inherit', background: 'none' }}
                        onClick={() => setDeleteTarget(m)}
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div className="d-flex gap-2 pt-3">
          <textarea
            className="form-control"
            rows={2}
            placeholder="Type a message… (Ctrl+Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            style={{ resize: 'none' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            style={{ alignSelf: 'flex-end' }}
          >
            <IconSend size={16} />
          </button>
        </div>
        <div className="form-hint mt-1">Ctrl+Enter to send · Client is notified by email if configured</div>
      </div>
    </>
  );
}
