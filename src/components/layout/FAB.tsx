import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import Button from '@/components/ui/Button';

export default function FAB() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  return (
    <Button
      variant="primary"
      iconOnly
      size="md"
      onClick={openQuickAdd}
      aria-label="Add task"
      style={{
        position: 'fixed',
        bottom: 72,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: '50%',
        boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
        zIndex: 200,
      }}
    >
      <Plus size={26} strokeWidth={2} />
    </Button>
  );
}
