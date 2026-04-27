import { useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconX } from '@tabler/icons-react';
import type { Client } from '../types';

interface ClientSearchSelectProps {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  error?: string;
  disabled?: boolean;
}

export const ClientSearchSelect = ({
  clients,
  value,
  onChange,
  error,
  disabled = false,
}: ClientSearchSelectProps) => {
  const selectedClient = clients.find((c) => c.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email?.toLowerCase().includes(query.toLowerCase()),
      )
    : clients;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (client: Client) => {
    onChange(client.id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div ref={containerRef} className="position-relative">
      <div
        className={`form-control d-flex align-items-center gap-2 cursor-pointer ${error ? 'is-invalid' : ''} ${disabled ? 'disabled' : ''}`}
        style={{ minHeight: '36px', cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          if (!open) setTimeout(() => inputRef.current?.focus(), 10);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            className="border-0 flex-grow-1 bg-transparent p-0 outline-none"
            style={{ outline: 'none', minWidth: 0 }}
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-grow-1 ${!selectedClient ? 'text-secondary' : ''}`}>
            {selectedClient ? selectedClient.name : 'Select a client…'}
          </span>
        )}
        {value && !open ? (
          <button
            type="button"
            className="btn btn-ghost-secondary btn-icon btn-sm p-0 border-0 lh-1"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Clear selection"
          >
            <IconX size={14} />
          </button>
        ) : (
          <IconChevronDown size={14} className="text-secondary flex-shrink-0" />
        )}
      </div>

      {open && (
        <div
          className="dropdown-menu show w-100 shadow-sm"
          style={{ maxHeight: '240px', overflowY: 'auto', top: '100%', zIndex: 1050 }}
        >
          {filtered.length === 0 ? (
            <div className="dropdown-item-text text-secondary small py-2 px-3">
              No clients match "{query}"
            </div>
          ) : (
            filtered.map((client) => (
              <button
                key={client.id}
                type="button"
                className={`dropdown-item d-flex flex-column align-items-start py-2 px-3 ${client.id === value ? 'active' : ''}`}
                onClick={() => handleSelect(client)}
              >
                <span className="fw-medium">{client.name}</span>
                {client.email && (
                  <span className="text-secondary small">{client.email}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
