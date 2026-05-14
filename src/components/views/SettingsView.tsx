import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskRepository } from '@/db/taskRepository';
import { toast } from '@/components/ui/Toast';
import type { Priority, ReminderOffset } from '@/types';

// ── Shared styles ─────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--text-sub)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 14,
};


// ── Sub-components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function SettingRow({ label, description, last, children }: {
  label: string;
  description?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid var(--border-default)',
    }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SegBtn({ selected, onClick, children }: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '5px 12px', borderRadius: 6, border: 'none',
        fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
        background: selected ? 'var(--accent)' : 'transparent',
        color: selected ? '#fff' : 'var(--text-sub)',
        transition: 'background 0.15s, color 0.15s, transform 0.1s, opacity 0.1s',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        opacity: pressed && !selected ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SegmentedControl<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: 3,
      gap: 2,
    }}>
      {options.map((opt) => {
        const sel = value === opt.value;
        return (
          <SegBtn key={opt.value} selected={sel} onClick={() => onChange(opt.value)}>
            {opt.label}
          </SegBtn>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 20, height: 20,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function SettingsView() {
  const {
    theme, updateSettings,
    defaultPriority, defaultReminderOffset,
    showCompleted,
    notificationsEnabled, notificationPermission,
    requestNotificationPermission, disableNotifications,
  } = useSettingsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Notification toggle ────────────────────────────────────────────────

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      disableNotifications();
      return;
    }
    if (notificationPermission === 'denied') {
      toast.error('Notifications are blocked — enable them in your browser settings.');
      return;
    }
    if (notificationPermission !== 'granted') {
      const result = await requestNotificationPermission();
      if (result !== 'granted') return;
    }
    updateSettings({ notificationsEnabled: true });
  };

  // ── Data actions ───────────────────────────────────────────────────────

  const handleClearCompleted = async () => {
    const count = await TaskRepository.clearCompleted();
    toast.success(`Cleared ${count} completed task${count !== 1 ? 's' : ''}`);
  };

  const handleExport = async () => {
    const json = await TaskRepository.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-todo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await TaskRepository.importJSON(text);
      toast.success(`Imported ${count} task${count !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Invalid file — could not import tasks');
    }
    e.target.value = '';
  };

  // ── Permission description ─────────────────────────────────────────────

  const permDesc: Record<typeof notificationPermission, string> = {
    granted:     'Browser permission granted',
    denied:      'Blocked — change in your browser site settings',
    default:     'Permission not yet requested',
    unsupported: 'Not supported in this browser',
  };

  return (
    <div style={{ maxWidth: 640 }}>

      {/* Appearance */}
      <Section title="Appearance">
        <div style={card}>
          <SettingRow label="Theme" last>
            <SegmentedControl
              value={theme}
              options={[
                { value: 'dark',   label: 'Dark'   },
                { value: 'light',  label: 'Light'  },
                { value: 'system', label: 'System' },
              ]}
              onChange={(v) => updateSettings({ theme: v })}
            />
          </SettingRow>
        </div>
      </Section>

      {/* Defaults */}
      <Section title="Defaults for new tasks">
        <div style={card}>
          <SettingRow label="Priority">
            <SegmentedControl<Priority>
              value={defaultPriority}
              options={[
                { value: 'none',   label: 'None'   },
                { value: 'low',    label: 'Low'    },
                { value: 'medium', label: 'Med'    },
                { value: 'high',   label: 'High'   },
              ]}
              onChange={(v) => updateSettings({ defaultPriority: v })}
            />
          </SettingRow>
          <SettingRow label="Reminder" description="Time before due to send a notification" last>
            <SegmentedControl<ReminderOffset>
              value={defaultReminderOffset}
              options={[
                { value: 'none', label: 'None' },
                { value: 'at',   label: 'At'   },
                { value: '15',   label: '15m'  },
                { value: '30',   label: '30m'  },
                { value: '60',   label: '1h'   },
                { value: '1440', label: '1d'   },
              ]}
              onChange={(v) => updateSettings({ defaultReminderOffset: v })}
            />
          </SettingRow>
        </div>
      </Section>

      {/* Task display */}
      <Section title="Task display">
        <div style={card}>
          <SettingRow label="Show completed tasks" description="Keep done tasks visible in all views" last>
            <Toggle
              checked={showCompleted}
              onChange={(v) => updateSettings({ showCompleted: v })}
            />
          </SettingRow>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div style={card}>
          <SettingRow label="Push notifications" description={permDesc[notificationPermission]} last>
            <Toggle
              checked={notificationsEnabled && notificationPermission === 'granted'}
              onChange={handleNotificationToggle}
            />
          </SettingRow>
        </div>
      </Section>

      {/* Data */}
      <Section title="Data">
        <div style={card}>
          <SettingRow label="Export tasks" description="Download all tasks as a JSON file">
            <Button variant="outline" onClick={handleExport}>Export JSON</Button>
          </SettingRow>
          <SettingRow label="Import tasks" description="Merge tasks from a previously exported file">
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Import JSON
              </Button>
            </>
          </SettingRow>
          <SettingRow label="Clear completed" description="Permanently delete all done tasks" last>
            <Button variant="danger" onClick={handleClearCompleted}>Clear</Button>
          </SettingRow>
        </div>
      </Section>
    </div>
  );
}
