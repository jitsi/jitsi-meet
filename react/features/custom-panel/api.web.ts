/**
 * Transport between the meeting and the custom panel iframe.
 *
 * The iframe creates the `MessageChannel` and posts `init_channel`; the meeting
 * receives it and validates the sender's origin. The backend keeps listening, so a
 * self-reloading iframe is re-adopted on its next handshake.
 */
import { MessageChannelTransportBackend, Transport } from '@jitsi/js-utils/transport';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { close } from './actions.web';
import { API_SCOPE, EVENT_CLOSE_PANEL } from './apiConstants';
import { EventHandler, ICustomPanelEvent } from './types';

/**
 * Owns the Transport for the custom panel iframe. The transport is recreated on every
 * URL change and disposed on unmount.
 *
 * @param {string} iframeUrl - The current iframe URL. Its origin is the only one the
 * backend accepts a port from.
 * @returns {void}
 */
export function useCustomPanelApi(iframeUrl: string): void {
    const dispatch = useDispatch();

    // Initialized once, so handlers must not close over live state. `dispatch` is stable.
    const eventHandlersRef = useRef<Record<string, EventHandler>>({
        [EVENT_CLOSE_PANEL]: () => {
            dispatch(close());
        }
    });

    useEffect(() => {
        if (!iframeUrl) {
            return;
        }

        let origin: string;

        try {
            origin = new URL(iframeUrl).origin;
        } catch {
            return;
        }

        const transport = new Transport({
            backend: new MessageChannelTransportBackend({
                origin,
                scope: API_SCOPE,
                shouldCreateChannel: false
            })
        });

        transport.on('event', (event: ICustomPanelEvent) => {
            const handler = eventHandlersRef.current[event?.name];

            if (handler) {
                handler(event);

                return true;
            }

            // Unprocessed events are stored and replayed to the next listener.
            return false;
        });

        return () => {
            transport.dispose();
        };
    }, [ iframeUrl ]);
}
