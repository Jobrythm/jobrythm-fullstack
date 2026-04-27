import { useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import { apiClient } from '../api/client';

interface AiDescribeInputProps {
  /** The API endpoint to POST the description to, e.g. '/ai/suggest-client' */
  endpoint: string;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Called with the parsed fields when the AI responds */
  onResult: (fields: Record<string, string>) => void;
}

/**
 * A collapsible "Describe in plain English" input that calls an AI endpoint
 * and returns structured field values to the parent form.
 */
export const AiDescribeInput = ({ endpoint, placeholder, onResult }: AiDescribeInputProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<Record<string, string>>(endpoint, { description: text.trim() });
      onResult(res.data);
      setOpen(false);
      setText('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'AI suggestion failed')
          : 'AI suggestion failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
        onClick={() => setOpen(true)}
      >
        <IconSparkles size={15} />
        Fill with AI
      </button>
    );
  }

  return (
    <div className="card border-primary mb-3">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="d-flex align-items-center gap-1 fw-semibold text-primary" style={{ fontSize: 13 }}>
            <IconSparkles size={14} />
            Describe in plain English
          </span>
          <button
            type="button"
            className="btn-close btn-sm"
            aria-label="Close"
            onClick={() => { setOpen(false); setText(''); setError(null); }}
          />
        </div>
        <textarea
          className="form-control form-control-sm mb-2"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? 'Describe what you want to create…'}
          disabled={loading}
        />
        {error && <small className="text-danger d-block mb-2">{error}</small>}
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                Generating…
              </>
            ) : (
              <>
                <IconSparkles size={14} />
                Generate
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-ghost-secondary btn-sm"
            onClick={() => { setOpen(false); setText(''); setError(null); }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
