import type { Task, ReminderOffset } from "@/types";
import { formatDueDate } from "@/utils/formatDate";

// ── Singleton schedule map ─────────────────────────────────────────────────
// taskId → setTimeout handle
const _scheduled = new Map<string, ReturnType<typeof setTimeout>>();

// setTimeout overflows at 2^31 - 1 ms (~24.8 days). Tasks beyond this window
// are skipped and re-scheduled the next time the app opens.
const MAX_DELAY_MS = 24 * 24 * 60 * 60 * 1000; // 24 days

// ── Helpers ────────────────────────────────────────────────────────────────

function offsetToMs(offset: ReminderOffset): number {
  switch (offset) {
    case "at":
      return 0;
    case "15":
      return 15 * 60_000;
    case "30":
      return 30 * 60_000;
    case "60":
      return 60 * 60_000;
    case "1440":
      return 24 * 60 * 60_000;
    default:
      return 0;
  }
}

/**
 * Returns the Unix ms timestamp when the notification should fire.
 * Uses the task's dueTime if set, otherwise defaults to 11:00 AM.
 */
function fireTimestamp(dueDate: string, offset: ReminderOffset, dueTime?: string): number {
  const time   = dueTime ?? '11:00';
  const dueMs  = new Date(`${dueDate}T${time}:00`).getTime();
  return dueMs - offsetToMs(offset);
}

/** Converts "14:30" → "2:30 PM" */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function showNotification(task: Task): void {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;
  try {
    const timePart = task.dueTime ? ` at ${formatTime(task.dueTime)}` : '';
    const body = task.dueDate
      ? `Due ${formatDueDate(task.dueDate)}${timePart}`
      : 'Reminder';

    const n = new Notification(task.title, {
      body,
      icon: "/pwa-192x192.png",
      tag: task.id, // prevents duplicate toasts for the same task
      silent: false,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Notification constructor can throw in some edge cases (e.g. data URLs)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Schedule a notification for a task. No-op if task is not eligible. */
export function scheduleNotification(task: Task): void {
  if (!task.dueDate || task.reminderOffset === "none" || task.status === "done")
    return;

  cancelNotification(task.id); // clear stale timer first

  const delayMs = fireTimestamp(task.dueDate, task.reminderOffset, task.dueTime) - Date.now();

  // Skip if already past or too far in the future
  if (delayMs <= 0 || delayMs > MAX_DELAY_MS) return;

  const handle = setTimeout(() => {
    showNotification(task);
    _scheduled.delete(task.id);
  }, delayMs);

  _scheduled.set(task.id, handle);
}

/** Cancel any scheduled notification for a task. */
export function cancelNotification(taskId: string): void {
  const handle = _scheduled.get(taskId);
  if (handle !== undefined) {
    clearTimeout(handle);
    _scheduled.delete(taskId);
  }
}

/** Cancel then re-schedule (use after an update that may change dueDate/offset). */
export function rescheduleNotification(task: Task): void {
  cancelNotification(task.id);
  scheduleNotification(task);
}

/** Schedule all eligible tasks (called on app start when permission is granted). */
export function schedulePendingNotifications(tasks: Task[]): void {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;
  tasks.forEach(scheduleNotification);
}

/** Clear every scheduled notification (e.g. when user disables notifications). */
export function cancelAllNotifications(): void {
  for (const handle of _scheduled.values()) clearTimeout(handle);
  _scheduled.clear();
}

/** Number of notifications currently scheduled in this session. */
export function scheduledCount(): number {
  return _scheduled.size;
}
