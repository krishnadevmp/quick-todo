import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

// ── Toast store (singleton, no Zustand needed) ────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'undo';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;        // ms, default 3500
  onUndo?: () => void;      // shown as action button when provided
}

type Listener = (toasts: ToastItem[]) => void;
let _toasts: ToastItem[] = [];
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach((l) => l([..._toasts]));
}

export const toast = {
  show(item: Omit<ToastItem, 'id'>): string {
    const id = crypto.randomUUID();
    _toasts = [{ ...item, id }, ..._toasts].slice(0, 5); // max 5
    notify();
    return id;
  },
  dismiss(id: string) {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  },
  success(message: string, duration = 3500) {
    return toast.show({ type: 'success', message, duration });
  },
  error(message: string, duration = 4000) {
    return toast.show({ type: 'error', message, duration });
  },
  info(message: string, duration = 3500) {
    return toast.show({ type: 'info', message, duration });
  },
  undo(message: string, onUndo: () => void, duration = 4000) {
    return toast.show({ type: 'undo', message, onUndo, duration });
  },
};

function useToasts(): ToastItem[] {
  const [items, setItems] = useState<ToastItem[]>([..._toasts]);
  useEffect(() => {
    _listeners.add(setItems);
    return () => { _listeners.delete(setItems); };
  }, []);
  return items;
}

// ── Single toast item ─────────────────────────────────────────────────────

const ICON = {
  success: <CheckCircle size={15} />,
  error:   <AlertCircle size={15} />,
  info:    <Info size={15} />,
  undo:    <Info size={15} />,
};

const COLOR: Record<ToastType, string> = {
  success: 'var(--accent)',
  error:   'var(--priority-high)',
  info:    'var(--text-sub)',
  undo:    'var(--priority-medium)',
};

function ToastCard({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => toast.dismiss(item.id), 250);
    }, item.duration ?? 3500);
    return () => clearTimeout(t);
  }, [item.id, item.duration]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 14px',
      borderRadius: 10,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-lg)',
      minWidth: 260,
      maxWidth: 380,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.22s ease, opacity 0.22s ease',
    }}>
      {/* Icon */}
      <span style={{ color: COLOR[item.type], flexShrink: 0, display: 'flex' }}>
        {ICON[item.type]}
      </span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {item.message}
      </span>

      {/* Undo button */}
      {item.onUndo && (
        <Button variant="outline" size="sm"
          style={{ borderColor: 'var(--priority-medium)', color: 'var(--priority-medium)' }}
          onClick={() => { item.onUndo?.(); toast.dismiss(item.id); }}>
          Undo
        </Button>
      )}

      {/* Dismiss */}
      <Button variant="ghost" iconOnly size="sm"
        style={{ color: 'var(--text-placeholder)' }}
        onClick={() => { setVisible(false); setTimeout(() => toast.dismiss(item.id), 250); }}>
        <X size={13} />
      </Button>
    </div>
  );
}

// ── Toast container (mount once in App) ──────────────────────────────────

export function ToastContainer() {
  const items = useToasts();
  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
    }}>
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
