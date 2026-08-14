import { useRef, useState } from 'react';
import { Search, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Menu, { MenuItem } from '@/components/ui/Menu';
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
    <Button
      onClick={onClick}
      variant={active ? "primary" : "outline"}
      size="sm"
      style={{
        borderRadius: 20,
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
        ...(active && activeColor
          ? { background: `${activeColor}18`, color: activeColor, border: `1.5px solid ${activeColor}` }
          : active
          ? { border: '1.5px solid var(--accent)' }
          : { border: '1.5px solid var(--border-default)' }),
      }}
    >
      {label}
    </Button>
  );
}

// ── Tag dropdown ──────────────────────────────────────────────────────────

function TagFilter({ allTags, selectedTags, onToggle }: {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}) {
  if (allTags.length === 0) return null;

  return (
    <Menu
      align="left"
      trigger={({ toggle }) => (
        <Button
          onClick={toggle}
          variant={selectedTags.length > 0 ? "primary" : "outline"}
          size="sm"
          style={{
            borderRadius: 20,
            fontWeight: selectedTags.length > 0 ? 600 : 400,
            border: `1.5px solid ${selectedTags.length > 0 ? 'var(--accent)' : 'var(--border-default)'}`,
          }}
        >
          Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          <ChevronDown size={11} />
        </Button>
      )}
    >
      {allTags.map((tag) => {
        const checked = selectedTags.includes(tag);
        return (
          <MenuItem key={tag} closeOnClick={false} onClick={() => onToggle(tag)}>
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
          </MenuItem>
        );
      })}
    </Menu>
  );
}

// ── Sort control ──────────────────────────────────────────────────────────

function SortControl({ sortBy, sortDir, onChange }: {
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  onChange: (sortBy: SortBy, sortDir: 'asc' | 'desc') => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';

  return (
    <Menu
      align="right"
      wrapperStyle={{ marginLeft: 'auto' }}
      trigger={({ toggle }) => (
        <Button
          onClick={toggle}
          variant="outline"
          size="sm"
          style={{ borderRadius: 20, border: '1.5px solid var(--border-default)', whiteSpace: 'nowrap' }}
        >
          <ArrowUpDown size={11} />
          {current}
        </Button>
      )}
    >
      {SORT_OPTIONS.map((opt) => (
        <MenuItem
          key={opt.value}
          active={sortBy === opt.value}
          style={{ justifyContent: 'space-between', fontWeight: sortBy === opt.value ? 600 : 400 }}
          onClick={() => {
            const newDir = opt.value === sortBy && sortDir === 'desc' ? 'asc' : 'desc';
            onChange(opt.value, newDir);
          }}
        >
          {opt.label}
          {sortBy === opt.value && (
            <span style={{ fontSize: 11 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
          )}
        </MenuItem>
      ))}
    </Menu>
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
          <Button variant="ghost" iconOnly size="sm"
            style={{ color: 'var(--text-placeholder)' }}
            onClick={() => { setSearchDraft(''); setFilter({ search: '' }); }}>
            <X size={14} />
          </Button>
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
          <Button variant="danger-ghost" size="sm"
            style={{ borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: 'var(--priority-high)' }}
            onClick={() => { resetFilter(); setSearchDraft(''); }}>
            <X size={11} />
            Clear {activeCount}
          </Button>
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
