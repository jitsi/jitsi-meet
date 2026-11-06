import logger from '../app/logger';
import { IStore } from '../app/types';

import { IBackgroundEffectsModule, getBackgroundEffects } from './bridge';

/** Tracks the state of a disconnect while background lifecycle work is running. */
interface IBackgroundDisconnect {
    /** Whether the latest tracked disconnect failed. */
    failed: boolean;
    /** Promise for the disconnect currently in progress, if any. */
    pending?: Promise<void>;
    /** Incremented whenever a new disconnect is tracked. */
    version: number;
}

/** Background lifecycle state associated with a store and owner revision. */
interface IBackgroundScope {
    /** Whether the scope may activate a background session. */
    canActivate: boolean;
    /** Maps conferences to the background session they use. */
    conferences: WeakMap<object, number>;
    /** State of the current or most recent disconnect. */
    disconnect: IBackgroundDisconnect;
    /** Whether this scope has been replaced or disposed. */
    disposed: boolean;
    /** Identifier of the background-session owner. */
    ownerId: string;
    /** Revision of the owner's background configuration. */
    ownerRevision: number;
    /** Tail promise used to serialize lifecycle operations. */
    pending: Promise<void>;
    /** Conferences whose session must not be ended during a redirect. */
    redirects: WeakSet<object>;
    /** Identifier of the active background session, or zero when none is active. */
    sessionId: number;
    /** Incremented to invalidate stale lifecycle work. */
    version: number;
}

const SCOPES = new WeakMap<IStore['getState'], IBackgroundScope>();

/**
 * Gets the current lifecycle scope for a store, replacing it when its owner changes.
 *
 * @returns {IBackgroundScope} The scope for the store's current owner revision.
 */
function getScope({ getState }: IStore) {
    let scope = SCOPES.get(getState);

    const props = getState()['features/base/app'].app?.props;
    const ownerId = props?.backgroundOwnerId ?? '';
    const ownerRevision = props?.backgroundOwnerRevision ?? 0;

    if (!scope || scope.ownerId !== ownerId || scope.ownerRevision !== ownerRevision) {
        const previous = scope;

        if (previous) {
            previous.disposed = true;
            previous.version += 1;
        }
        scope = {
            canActivate: !previous,
            conferences: new WeakMap(),
            disconnect: previous?.disconnect ?? { failed: false, version: 0 },
            disposed: false,
            ownerId,
            ownerRevision,
            pending: previous?.pending ?? Promise.resolve(),
            redirects: new WeakSet(),
            sessionId: 0,
            version: 0
        };
        SCOPES.set(getState, scope);
    }

    return scope;
}

/**
 * Returns the native bridge when all lifecycle methods are available.
 *
 * @returns {IBackgroundEffectsModule | undefined} The bridge, when lifecycle methods are available.
 */
function getLifecycleBridge(): IBackgroundEffectsModule | undefined {
    const bridge = getBackgroundEffects();

    return typeof bridge?.beginSession === 'function' && typeof bridge?.endSession === 'function'
        && typeof bridge?.freeze === 'function' ? bridge : undefined;
}

/**
 * Queues an operation after the scope's current lifecycle operation.
 *
 * @param {IBackgroundScope} scope - Scope whose operations are queued.
 * @param {Function} operation - Operation to run after the current lifecycle operation.
 * @returns {Promise<void>} Promise returned by the queued operation.
 */
function enqueue(scope: IBackgroundScope, operation: () => Promise<void>) {
    const result = scope.pending.then(operation);

    scope.pending = result.catch(error => {
        logger.error('Background lifecycle operation failed', error);
    });

    return result;
}

/**
 * Tracks a disconnect so background activation can wait for it to finish.
 *
 * @param {IStore} store - Store whose background lifecycle is being updated.
 * @param {Function} disconnect - Disconnect operation to track.
 * @returns {Promise<void>} The in-flight disconnect promise.
 */
export function trackBackgroundDisconnect(store: IStore, disconnect: () => Promise<void>) {
    const scope = getScope(store);
    const barrier = scope.disconnect;

    if (barrier.pending) {
        return barrier.pending;
    }
    let resolveDisconnect: () => void;
    let rejectDisconnect: (error: unknown) => void;
    const pending = new Promise<void>((resolve, reject) => {
        resolveDisconnect = resolve;
        rejectDisconnect = reject;
    });

    barrier.version += 1;
    barrier.failed = false;
    barrier.pending = pending;
    pending.then(() => {
        if (barrier.pending === pending) {
            barrier.pending = undefined;
        }
    }, error => {
        if (barrier.pending === pending) {
            barrier.pending = undefined;
            barrier.failed = true;
        }
        logger.error('Native disconnect failed', error);
    });
    try {
        disconnect().then(resolveDisconnect!, rejectDisconnect!);
    } catch (error) {
        rejectDisconnect!(error);
    }

    return pending;
}

/**
 * Waits until no tracked disconnect is pending for the scope.
 *
 * @param {IBackgroundScope} scope - Scope whose disconnect is being awaited.
 * @returns {Promise<void>} Promise that settles when the tracked disconnect settles.
 */
async function waitForBackgroundDisconnect(scope: IBackgroundScope) {
    while (scope.disconnect.pending) {
        await scope.disconnect.pending;
    }
}

/**
 * Captures a predicate that checks whether the current connection may proceed.
 *
 * @param {IStore} store - Store whose background lifecycle is checked.
 * @returns {Function} Predicate that is true while the captured connection remains valid.
 */
export function captureBackgroundConnection(store: IStore) {
    const scope = getScope(store);
    const version = scope.version;
    const disconnectVersion = scope.disconnect.version;

    return () => getScope(store) === scope && !scope.disposed && scope.canActivate
        && scope.version === version && scope.disconnect.version === disconnectVersion
        && !scope.disconnect.pending && !scope.disconnect.failed;
}

/**
 * Checks whether the store has an active background session when required.
 *
 * @param {IStore} store - Store whose background lifecycle is checked.
 * @returns {boolean} Whether the store can proceed with its background session state.
 */
export function hasBackgroundSession(store: IStore) {
    const scope = getScope(store);

    return !getLifecycleBridge() || (!scope.disposed && !scope.disconnect.pending
        && !scope.disconnect.failed && scope.sessionId !== 0);
}

/**
 * Freezes native processing when a lifecycle bridge is available, then runs the disconnect.
 *
 * @param {IStore} store - Store whose background session is being navigated.
 * @param {Function} disconnect - Disconnect operation to run during navigation.
 * @returns {Promise<Function>} Predicate that reports whether this navigation is still current.
 */
export async function beginBackgroundNavigation(store: IStore, disconnect: () => Promise<void>) {
    const scope = getScope(store);
    const version = ++scope.version;

    scope.canActivate = false;
    const isCurrent = () => !scope.disposed && scope.version === version;
    const bridge = getLifecycleBridge();

    await enqueue(scope, async () => {
        if (!isCurrent()) {
            return;
        }
        if (bridge) {
            await bridge.freeze(scope.ownerId, scope.ownerRevision);
            scope.sessionId = 0;
        }
        await disconnect();
        await waitForBackgroundDisconnect(scope);
        if (!isCurrent() || scope.disconnect.failed) {
            return;
        }
        scope.canActivate = true;
        if (!bridge) {
            return;
        }
        const state = await bridge.beginSession(scope.ownerId, scope.ownerRevision);

        if (isCurrent()) {
            scope.sessionId = state.sessionId;
        } else if (state.sessionId) {
            await bridge.endSession(scope.ownerId, scope.ownerRevision, state.sessionId);
        }
    });

    return isCurrent;
}

/**
 * Ensures the current scope has a background session when a lifecycle bridge is available.
 *
 * @param {IStore} store - Store whose background session should be ensured.
 * @returns {Promise<boolean>} Whether the scope remains eligible to connect.
 */
export async function ensureBackgroundSession(store: IStore) {
    const scope = getScope(store);
    const version = scope.version;
    const disconnectVersion = scope.disconnect.version;
    const bridge = getLifecycleBridge();

    await enqueue(scope, async () => {
        await waitForBackgroundDisconnect(scope);
        if (scope.disposed || !scope.canActivate || scope.disconnect.failed
                || scope.disconnect.version !== disconnectVersion || scope.version !== version
                || scope.sessionId || !bridge) {
            return;
        }
        const state = await bridge.beginSession(scope.ownerId, scope.ownerRevision);

        if (!scope.disposed && scope.version === version && scope.disconnect.version === disconnectVersion
                && !scope.disconnect.pending && !scope.disconnect.failed) {
            scope.sessionId = state.sessionId;
        } else if (state.sessionId) {
            await bridge.endSession(scope.ownerId, scope.ownerRevision, state.sessionId);
        }
    });

    return !scope.disposed && scope.canActivate && scope.version === version
        && scope.disconnect.version === disconnectVersion && !scope.disconnect.pending && !scope.disconnect.failed;
}

/**
 * Associates a conference with the active background session.
 *
 * @param {IStore} store - Store that owns the background session.
 * @param {Object} [conference] - Conference to associate, when available.
 * @returns {void}
 */
export function bindBackgroundConference(store: IStore, conference?: object) {
    const scope = getScope(store);

    if (conference && scope.sessionId) {
        scope.conferences.set(conference, scope.sessionId);
    }
}

/**
 * Ends the background session associated with a conference unless it is redirecting.
 *
 * @param {IStore} store - Store that owns the background session.
 * @param {Object} [conference] - Conference whose session may be ended.
 * @param {boolean} [isRedirect=false] - Whether the conference is being redirected.
 * @returns {Promise<void>} Resolves when cleanup of the conference session completes.
 */
export async function endBackgroundConference(store: IStore, conference?: object, isRedirect = false) {
    const scope = getScope(store);

    if (!conference) {
        return;
    }
    if (isRedirect) {
        scope.redirects.add(conference);
    }
    if (scope.redirects.has(conference)) {
        return;
    }
    const sessionId = scope.conferences.get(conference);

    if (!sessionId) {
        return;
    }
    scope.conferences.delete(conference);
    if (scope.sessionId === sessionId) {
        scope.sessionId = 0;
    }
    await getLifecycleBridge()?.endSession(scope.ownerId, scope.ownerRevision, sessionId);
}

/**
 * Disposes the scope and requests a native freeze when the lifecycle bridge is available.
 *
 * @param {IStore} store - Store whose background scope should be disposed.
 * @returns {Promise<void>} Resolves when the optional native freeze completes.
 */
export async function disposeBackgroundScope(store: IStore) {
    const scope = getScope(store);

    scope.disposed = true;
    scope.version += 1;
    scope.sessionId = 0;
    await getLifecycleBridge()?.freeze(scope.ownerId, scope.ownerRevision);
}
