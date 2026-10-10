import { canvasSyncStatus } from '@/shared/storage';
import { isStale, syncCanvas } from '@/shared/canvas/sync';

// Fallback sync: a same-origin request from a Canvas page always carries the session.
export default defineContentScript({
  matches: ['*://byu.instructure.com/*'],
  async main() {
    if (isStale(await canvasSyncStatus.getValue())) {
      await syncCanvas(location.origin);
    }
  },
});
