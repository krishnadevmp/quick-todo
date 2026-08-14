import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import AddMenu from './AddMenu';

export default function FAB() {
  return (
    <AddMenu
      align="right" direction="up"
      wrapperStyle={{ position: 'fixed', bottom: 72, right: 16, zIndex: 200 }}
      trigger={({ toggle }) => (
        <Button
          variant="primary"
          iconOnly
          size="md"
          onClick={toggle}
          aria-label="Add"
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          }}
        >
          <Plus size={26} strokeWidth={2} />
        </Button>
      )}
    />
  );
}
