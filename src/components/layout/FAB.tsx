import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export default function FAB() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  return (
    <button
      onClick={openQuickAdd}
      aria-label="Add task"
      style={{
        position: 'fixed',
        bottom: 72,
        right: 16,
        width: 56, height: 56,
        borderRadius: '50%',
        background: 'var(--accent)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
        zIndex: 200,
        transition: 'transform 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.background = 'var(--accent-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'var(--accent)';
      }}
    >
      <Plus size={26} strokeWidth={2} />
    </button>
  );
}
