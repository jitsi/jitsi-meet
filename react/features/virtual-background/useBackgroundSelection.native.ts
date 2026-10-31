import { useEffect, useState } from 'react';

import { getBackgroundEffects } from './bridge';
import useBackgroundPolling from './useBackgroundPolling';

/**
 * Manages selection of a native background effect.
 *
 * @returns {Object} Selection state and controls:
 * - `background`: The current background state, or `undefined` until it loads or after a load failure.
 * - `disabled` (`boolean`): Whether selection is pending or the background has no session ID.
 * - `error` (`string`): A selection or load-error key, or an empty string.
 * - `loading` (`boolean`): Whether the background is unavailable and has no load error.
 * - `pending` (`boolean`): Whether a selection request is in progress.
 * - `select`: An async handler accepting a choice string and resolving to `Promise<void>`.
 */
export default function useBackgroundSelection() {
    const [ error, setError ] = useState('');
    const [ pending, setPending ] = useState(false);
    const {
        background, loadError, mounted, ownerId, ownerRevision, pendingRequest, revision, setBackground
    } = useBackgroundPolling();

    useEffect(() => {
        setError('');
        setPending(false);
    }, [ ownerId, ownerRevision ]);

    /**
     * Applies a background effect through the native bridge.
     *
     * @param {string} choice - Native background effect choice to apply.
     * @returns {Promise<void>} Resolves when the selection request settles.
     */
    async function select(choice: string) {
        const bridge = getBackgroundEffects();

        if (!bridge || !background?.sessionId || pendingRequest.current) {
            return;
        }
        const request = {};

        pendingRequest.current = request;
        revision.current += 1;
        const requestRevision = revision.current;

        setPending(true);
        setError('');
        try {
            const state = await bridge.select(ownerId, ownerRevision, { sessionId: background.sessionId, choice });

            if (mounted.current && revision.current === requestRevision) {
                if (state.sessionId === background.sessionId) {
                    setBackground(state);
                } else {
                    setError('virtualBackground.nativeSessionChanged');
                }
            }
        } catch (failure: any) {
            if (mounted.current && revision.current === requestRevision) {
                setError(failure?.code === 'stale_session'
                    ? 'virtualBackground.nativeSessionChanged'
                    : 'virtualBackground.backgroundEffectError');
            }
        } finally {
            if (pendingRequest.current === request) {
                revision.current += 1;
                pendingRequest.current = null;
                if (mounted.current) {
                    setPending(false);
                }
            }
        }
    }

    return {
        background,
        disabled: pending || !background?.sessionId,
        error: error || loadError,
        loading: !background && !loadError,
        pending,
        select
    };
}
