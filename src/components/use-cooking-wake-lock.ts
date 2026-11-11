'use client';
import { useEffect, type RefObject } from 'react';

export function useCookingWakeLock(dialogRef: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !window.isSecureContext || !navigator.wakeLock?.request) return;
    let lock: WakeLockSentinel | null = null;
    let pending = false;
    let disposed = false;
    let suspended = false;
    const wanted = () =>
      !disposed && !suspended && dialog.open && document.visibilityState === 'visible';
    function release() {
      const previous = lock;
      lock = null;
      if (previous) void previous.release().catch(() => {});
    }
    async function sync() {
      if (!wanted()) {
        release();
        return;
      }
      if (pending || (lock && !lock.released)) return;
      pending = true;
      try {
        const granted = await navigator.wakeLock.request('screen');
        // Closing the dialog or leaving the page can happen while permission is pending.
        if (wanted()) lock = granted;
        else await granted.release();
      } catch {
        // Unsupported devices, battery saving and denied permission stay silent.
      } finally {
        pending = false;
      }
    }
    const onHide = () => {
      suspended = true;
      release();
    };
    const onShow = () => {
      suspended = false;
      void sync();
    };
    const observer = new MutationObserver(() => {
      void sync();
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    dialog.addEventListener('close', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    void sync();
    return () => {
      disposed = true;
      observer.disconnect();
      dialog.removeEventListener('close', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
      release();
    };
  }, [dialogRef]);
}
