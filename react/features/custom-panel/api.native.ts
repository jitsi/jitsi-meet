import { Transport } from '@jitsi/js-utils/transport';
import { useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';

import { goBack } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';

import ReactNativeWebViewTransportBackend, { createMessageSource } from './ReactNativeWebViewTransportBackend.native';
import { API_SCOPE, EVENT_CLOSE_PANEL } from './constants';
import logger from './logger';
import { EventHandler, ICustomPanelEvent } from './types';

interface INavigation {
    isFocused: () => boolean;
}

/**
 * Owns the Transport for the advisor WebView. Mirrors `api.web.ts`, with a different
 * backend because a `MessageChannel` cannot cross the react-native-webview bridge.
 *
 * @param {string} fullUrl - The advisor URL. The transport is recreated when it changes.
 * @param {INavigation} navigation - The screen's navigation object.
 * @returns {Object}
 */
export function useCustomPanelApi(fullUrl: string, navigation: INavigation) {
    const webViewRef = useRef<WebView>(null);
    const [ messageSource ] = useState(createMessageSource);

    // Initialized once, so handlers must not close over live state. `navigation.isFocused()`
    // reads through a live getState(), so capturing it here is fine.
    const eventHandlersRef = useRef<Record<string, EventHandler>>({
        [EVENT_CLOSE_PANEL]: () => {
            // A late close-panel after a manual back press must not pop a second screen.
            if (navigation.isFocused()) {
                goBack();
            }
        }
    });

    useEffect(() => {
        if (!fullUrl) {
            return;
        }

        const transport = new Transport({
            backend: new ReactNativeWebViewTransportBackend({
                scope: API_SCOPE,
                send: data => webViewRef.current?.postMessage(data),
                subscribe: messageSource.subscribe
            })
        });

        transport.on('event', (event: ICustomPanelEvent) => {
            const handler = eventHandlersRef.current[event?.name];

            if (handler) {
                handler(event);

                return true;
            }

            logger.debug(`Unknown event received from ${fullUrl}: ${event?.name}`);

            // Unprocessed events are stored and replayed to the next listener.
            return false;
        });

        return () => {
            // Disposes the backend too.
            transport.dispose();
        };
    }, [ fullUrl ]);

    return {
        onMessage: messageSource.onMessage,
        webViewRef
    };
}
