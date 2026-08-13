export enum CameraControlTimer {

    // Owner side: refuses a request the local participant never answered. Distinct from REQUEST because an endpoint
    // can be waiting for an answer about someone else's camera while being asked about its own.
    APPROVAL = 'approval',

    // Controller side: keeps an idle lease alive.
    KEEPALIVE = 'keepalive',

    // Owner side: fires when the lease of the participant holding the lock runs out.
    LEASE = 'lease',

    // Controller side: gives up on a request the owner never answered.
    REQUEST = 'request'
}

const timers = new Map<CameraControlTimer, () => void>();

/**
 * Cancels a running timer, if there is one.
 *
 * @param {CameraControlTimer} name - The timer to cancel.
 * @returns {void}
 */
export function clearTimer(name: CameraControlTimer) {
    const cancel = timers.get(name);

    if (cancel) {
        cancel();
        timers.delete(name);
    }
}

/**
 * Cancels every running timer, for when a session ends however it ends.
 *
 * @returns {void}
 */
export function clearTimers() {
    Object.values(CameraControlTimer).forEach(clearTimer);
}

/**
 * Runs a callback once after the given delay, replacing any previous timer of the same name.
 *
 * @param {CameraControlTimer} name - The timer to start.
 * @param {number} delay - How long (ms) to wait.
 * @param {Function} callback - What to run.
 * @returns {void}
 */
export function startTimeout(name: CameraControlTimer, delay: number, callback: () => void) {
    clearTimer(name);

    const handle = window.setTimeout(() => {
        timers.delete(name);
        callback();
    }, delay);

    timers.set(name, () => window.clearTimeout(handle));
}

/**
 * Runs a callback on an interval, replacing any previous timer of the same name.
 *
 * @param {CameraControlTimer} name - The timer to start.
 * @param {number} interval - How often (ms) to run the callback.
 * @param {Function} callback - What to run.
 * @returns {void}
 */
export function startInterval(name: CameraControlTimer, interval: number, callback: () => void) {
    clearTimer(name);

    const handle = window.setInterval(callback, interval);

    timers.set(name, () => window.clearInterval(handle));
}
