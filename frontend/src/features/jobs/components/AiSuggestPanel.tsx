import { IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { apiClient } from '../../../api/client';

interface AiSuggestion {
  description: string;
  quantity: number;
  unitPriceCents: number;
  category: string;
}

interface AiSuggestResponse {
  suggestions: AiSuggestion[];
  model: string;
}

interface AddPayload {
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
}

interface Props {
  jobId: string;
  onAdd: (item: AddPayload) => void;
}

export const AiSuggestPanel = ({ jobId, onAdd }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    setOpen(true);
    try {
      const { data } = await apiClient.post<AiSuggestResponse>(
        `/jobs/${jobId}/ai-suggest-line-items`,
        undefined,
        // AI generation can take longer than the default 10s axios timeout.
        { timeout: 60000 },
      );
      setSuggestions(data.suggestions);
      setSelected(new Set(data.suggestions.map((_, i) => i)));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Failed to get AI suggestions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleAddSelected = () => {
    suggestions.forEach((s, i) => {
      if (selected.has(i)) {
        const price = s.unitPriceCents / 100;
        onAdd({
          description: s.description,
          category: s.category,
          quantity: s.quantity,
          unit: s.category === 'labour' ? 'hrs' : 'ea',
          unitCost: Math.round(price * 0.6 * 100) / 100,
          unitPrice: price,
        });
      }
    });
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        onClick={handleSuggest}
        disabled={loading}
      >
        <IconSparkles size={14} className="me-1" />
        {loading ? 'Generating…' : 'AI Suggest Line Items'}
      </button>

      {open && (
        <div className="card mt-2">
          <div className="card-header d-flex align-items-center justify-content-between py-2">
            <span className="card-title mb-0 fs-5">
              <IconSparkles size={14} className="me-1 text-primary" />
              AI Suggestions
            </span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setOpen(false)}
            />
          </div>
          <div className="card-body py-2">
            {loading && (
              <div className="text-muted">
                <span className="spinner-border spinner-border-sm me-2" />
                Analysing your job history…
              </div>
            )}
            {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}
            {!loading && suggestions.length > 0 && (
              <>
                <p className="text-muted mb-2 small">
                  Select items to add. Unit cost is estimated at 60% of price.
                </p>
                <div className="list-group list-group-flush mb-3">
                  {suggestions.map((s, i) => (
                    <label key={i} className="list-group-item list-group-item-action py-2 cursor-pointer">
                      <div className="d-flex align-items-start gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input mt-1 flex-shrink-0"
                          checked={selected.has(i)}
                          onChange={() => toggleSelect(i)}
                        />
                        <div className="flex-grow-1">
                          <div className="fw-medium">{s.description}</div>
                          <small className="text-muted">
                            Qty {s.quantity} · ${(s.unitPriceCents / 100).toFixed(2)}/unit ·{' '}
                            <span className="badge bg-secondary-lt">{s.category}</span>
                          </small>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddSelected}
                    disabled={selected.size === 0}
                  >
                    Add {selected.size} Selected
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost-secondary btn-sm"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
