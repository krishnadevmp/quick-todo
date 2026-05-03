import { useRef, useEffect, useState } from 'react';
import { Search, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import type { Priority, Category, SortBy } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high',   label: '🔴 High',   color: 'var(--priority-high)'   },
  { value: 'medium', label: '🟡 Medium', color: 'var(--priority-medium)' },
  { value: 'low',    label: '⬜ Low',    color: 'var(--priority-low)'    },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'work',     label: '💼 Work'     },
  { value: 'personal', label: '👤 Personal' },
  { value: 'project',  label: '🚀 Project'  },
  { value: 'routine',  label: '🔁 Routine'  },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: 'Date created' },
  { value: 'dueDate',   label: 'Due date'     },
  { value: 'priority',  label: 'Priority'     },
];

// ── Chip ──────────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? (activeColor ?? 'var(--accent)') : 'var(--border-default)'}`,
        background: active ? (activeColor ? `${activeColor}18` : 'var(--accent-soft)') : 'transparent',
        color: active ? (activeColor ?? 'var(--accent)') : 'var(--text-sub)',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ── Tag dropdown ──────────────────────────────────────────────────────────

function TagFilter({ allTags, selectedTags, onToggle }: {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (allTags.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: selectedTags.length > 0 ? 600 : 400,
          border: `1.5px solid ${selectedTags.length > 0 ? 'var(--accent)' : 'var(--border-default)'}`,
          background: selectedTags.length > 0 ? 'var(--accent-soft)' : 'transparent',
          color: selectedTags.length > 0 ? 'var(--accent)' : 'var(--text-sub)',
          cursor: 'pointer',
        }}
      >
        Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 20,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 160,
          padding: '6px 0',
        }}>
          {allTags.map((tag) => {
            const checked = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 12px',
                  background: checked ? 'var(--accent-soft)' : 'transparent',
                  color: checked ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 14, height: 14,
                  borderRadius: 3,
                  border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-default)'}`,
                  background: checked ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sort control ──────────────────────────────────────────────────────────

function SortControl({ sortBy, sortDir, onChange }: {
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  onChange: (sortBy: SortBy, sortDir: 'asc' | 'desc') => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: 'auto' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          border: '1.5px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-sub)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowUpDown size={11} />
        {current}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 20,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 160,
          padding: '6px 0',
        }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                // Clicking same field toggles direction
                const newDir = opt.value === sortBy && sortDir === 'desc' ? 'asc' : 'desc';
                onChange(opt.value, newDir);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 12px',
                background: sortBy === opt.value ? 'var(--accent-soft)' : 'transparent',
                color: sortBy === opt.value ? 'var(--accent)' : 'var(--text-primary)',
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                fontWeight: sortBy === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
              {sortBy === opt.value && (
                <span style={{ fontSize: 11 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main FilterBar ────────────────────────────────────────────────────────

interface FilterBarProps {
  allTags: string[];
}

export default function FilterBar({ allTags }: FilterBarProps) {
  const { filter, setFilter, resetFilter } = useTaskStore();
  const [searchDraft, setSearchDraft] = useState(filter.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  const handleSearch = (val: string) => {
    setSearchDraft(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter({ search: val }), 300);
  };

  const toggleTag = (tag: string) => {
    const next = filter.tags.includes(tag)
      ? filter.tags.filter((t) => t !== tag)
      : [...filter.tags, tag];
    setFilter({ tags: next });
  };

  // Count active filters (excluding sort)
  const activeCount =
    (filter.priority ? 1 : 0) +
    (filter.category ? 1 : 0) +
    filter.tags.length +
    (filter.search ? 1 : 0);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Search bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        marginBottom: 10,
      }}>
        <Search size={14} style={{ color: 'var(--text-placeholder)', flexShrink: 0 }} />
        <input
          value={searchDraft}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search tasks…"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text-primary)',
            caretColor: 'var(--accent)',
          }}
        />
        {searchDraft && (
          <button
            onClick={() => { setSearchDraft(''); setFilter({ search: '' }); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter chips row — scrollable horizontally on narrow viewports */}
      <div style={{
        display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 6,
        overflowX: 'auto', paddingBottom: 2,
        scrollbarWidth: 'none',
      }}>
        {/* Priority chips */}
        {PRIORITIES.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            active={filter.priority === p.value}
            activeColor={p.color}
            onClick={() => setFilter({ priority: filter.priority === p.value ? undefined : p.value })}
          />
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 2px' }} />

        {/* Category chips */}
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={filter.category === c.value}
            onClick={() => setFilter({ category: filter.category === c.value ? undefined : c.value })}
          />
        ))}

        {/* Tag dropdown */}
        {allTags.length > 0 && (
          <>
            <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 2px' }} />
            <TagFilter allTags={allTags} selectedTags={filter.tags} onToggle={toggleTag} />
          </>
        )}

        {/* Clear filters */}
        {activeCount > 0 && (
          <button
            onClick={() => { resetFilter(); setSearchDraft(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20, fontSize: 12,
              border: 'none', background: 'rgba(239,68,68,0.1)',
              color: 'var(--priority-high)', cursor: 'pointer', fontWeight: 500,
            }}
          >
            <X size={11} />
            Clear {activeCount}
          </button>
        )}

        {/* Sort */}
        <SortControl
          sortBy={filter.sortBy}
          sortDir={filter.sortDir}
          onChange={(sortBy, sortDir) => setFilter({ sortBy, sortDir })}
        />
      </div>
    </div>
  );
}
