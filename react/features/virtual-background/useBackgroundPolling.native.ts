import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import { IBackgroundState, getBackgroundEffects } from './bridge';

/**
 * Polls the native bridge for the background state owned by the current app.
 *
 * @returns {Object} Polling state and controls:
 * - `background`: `IBackgroundState` or `undefined` until it loads or after a load failure.
 * - `loadError`: A load or unavailable translation key, or an empty string.
 * - `mounted`: A boolean ref that indicates whether the hook is mounted.
 * - `ownerId`: The owner ID from app props, defaulting to the empty string.
 * - `ownerRevision`: The owner revision from app props, defaulting to `0`.
 * - `pendingRequest`: An object ref holding the active selection request token, or `null`.
 * - `revision`: A number ref used to ignore stale poll and selection responses.
 * - `setBackground`: The state setter for `background`.
 */
export default function useBackgroundPolling() {
    const ownerId = useSelector((state: IReduxState) =>
        state['features/base/app'].app?.props?.backgroundOwnerId ?? '');
    const ownerRevision = useSelector((state: IReduxState) =>
        state['features/base/app'].app?.props?.backgroundOwnerRevision ?? 0);
    const [ background, setBackground ] = useState<IBackgroundState>();
    const [ loadError, setLoadError ] = useState('');
    const mounted = useRef(false);
    const pendingRequest = useRef<object | null>(null);
    const revision = useRef(0);

    useEffect(() => {
        const bridge = getBackgroundEffects();
        let inFlight = false;

        mounted.current = true;
        revision.current += 1;
        pendingRequest.current = null;
        setBackground(undefined);
        setLoadError('');

        async function poll() {
            if (!bridge || inFlight || pendingRequest.current) {
                return;
            }
            inFlight = true;
            const requestRevision = revision.current;

            try {
                const state = await bridge.getState(ownerId, ownerRevision);

                if (mounted.current && revision.current === requestRevision && !pendingRequest.current) {
                    setBackground(state);
                    setLoadError('');
                }
            } catch {
                if (mounted.current && revision.current === requestRevision) {
                    setBackground(undefined);
                    setLoadError('virtualBackground.nativeLoadError');
                }
            } finally {
                inFlight = false;
            }
        }

        if (bridge) {
            poll();
        } else {
            setLoadError('virtualBackground.nativeUnavailable');
        }
        const timer = setInterval(poll, 750);

        return () => {
            mounted.current = false;
            revision.current += 1;
            clearInterval(timer);
        };
    }, [ ownerId, ownerRevision ]);

    return { background, loadError, mounted, ownerId, ownerRevision, pendingRequest, revision, setBackground };
}
