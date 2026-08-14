import { ListTodo, Wallet } from 'lucide-react';
import Menu, { MenuItem } from '@/components/ui/Menu';
import { useUIStore } from '@/stores/uiStore';

// ── AddMenu ───────────────────────────────────────────────────────────────
// The single "+" affordance used everywhere (Sidebar, Topbar, mobile FAB).
// Always opens an explicit "New Task" / "New Expense" picker rather than
// silently changing meaning based on which screen you're on.

interface AddMenuProps {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  wrapperStyle?: React.CSSProperties;
}

export default function AddMenu({ trigger, align, direction, wrapperStyle }: AddMenuProps) {
  const openQuickAdd   = useUIStore((s) => s.openQuickAdd);
  const openAddExpense = useUIStore((s) => s.openAddExpense);

  return (
    <Menu trigger={trigger} align={align} direction={direction} wrapperStyle={wrapperStyle}>
      <MenuItem onClick={openQuickAdd}>
        <ListTodo size={14} /> New Task
      </MenuItem>
      <MenuItem onClick={openAddExpense}>
        <Wallet size={14} /> New Expense
      </MenuItem>
    </Menu>
  );
}
