import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CANVAS_ORIGIN } from '@/shared/canvas/api';
import { SYNC_CANVAS_MESSAGE, isStale } from '@/shared/canvas/sync';
import { canvasCourses, canvasSyncStatus } from '@/shared/storage';
import { useStorageItem } from './useStorageItem';

// Phase 3 view: Canvas courses and sync controls. Phase 5 replaces it with the GPA planner.
export default function App() {
  const courses = useStorageItem(canvasCourses);
  const status = useStorageItem(canvasSyncStatus);
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    try {
      await browser.runtime.sendMessage({ type: SYNC_CANVAS_MESSAGE });
    } finally {
      setSyncing(false);
    }
  }

  // Refresh on open when the saved data is stale (FR-35).
  useEffect(() => {
    canvasSyncStatus.getValue().then((saved) => {
      if (isStale(saved)) sync();
    });
  }, []);

  return (
    <div className="w-80 p-4 bg-slate-900 text-white font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h1 className="text-lg font-bold text-byu-royal">BYU Grade Hub</h1>
        <button
          onClick={sync}
          disabled={syncing}
          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          Sync Canvas Now
        </button>
      </div>

      {status?.error === 'logged-out' && (
        <p className="mb-3 text-sm text-amber-400">
          <a href={CANVAS_ORIGIN} target="_blank" rel="noreferrer" className="underline">
            Visit Canvas to reconnect
          </a>
        </p>
      )}
      {status?.error === 'failed' && (
        <p className="mb-3 text-sm text-amber-400">
          Couldn&apos;t reach Canvas. Showing saved grades.
        </p>
      )}

      {courses?.length === 0 ? (
        <p className="text-sm text-slate-400">No current Canvas courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {courses?.map((course) => (
            <li key={course.key} className="flex justify-between gap-3 text-sm">
              <span className="truncate">{course.name}</span>
              <span className="shrink-0 text-slate-300">
                {course.currentLetter === null
                  ? 'No grade yet'
                  : `${course.currentLetter} · ${course.currentPercent?.toFixed(1) ?? '—'}%`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        Canvas: {formatLastSynced(status?.lastSyncedAt ?? null)}
      </p>
    </div>
  );
}

function formatLastSynced(timestamp: number | null): string {
  if (timestamp === null) return 'never synced';
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}
