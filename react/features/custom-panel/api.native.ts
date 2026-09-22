import { Transport } from '@jitsi/js-utils/transport';
import { useCallback, useEffect, useRef } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { goBack } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';

import ReactNativeWebViewTransportBackend from './ReactNativeWebViewTransportBackend.native';
import { API_SCOPE, EVENT_CLOSE_PANEL } from './apiConstants';
import logger from './logger';
import { EventHandler, ICustomPanelEvent } from './types';

interface INavigation {
    isFocused: () => boolean;
}

/**
 * Owns the Transport for the advisor WebView. Mirrors `api.web.ts`, with a different
 * backend because a `MessageChannel` cannot cross the react-native-webview bridge.
 *
 * @param {string} uri - The advisor URL. The transport is recreated when it changes.
 * @param {INavigation} navigation - The screen's navigation object.
 * @returns {Object}
 */
export function useCustomPanelApi(uri: string, navigation: INavigation) {
    const webViewRef = useRef<WebView>(null);
    const backendRef = useRef<ReactNativeWebViewTransportBackend>();

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
        if (!uri) {
            return;
        }

        const backend = new ReactNativeWebViewTransportBackend({ scope: API_SCOPE });
        const transport = new Transport({ backend });

        backendRef.current = backend;

        transport.on('event', (event: ICustomPanelEvent) => {
            const handler = eventHandlersRef.current[event?.name];

            if (handler) {
                handler(event);

                return true;
            }

            logger.debug(`Unknown event received from ${uri}: ${event?.name}`);

            // Unprocessed events are stored and replayed to the next listener.
            return false;
        });

        return () => {
            backendRef.current = undefined;

            // Disposes the backend too.
            transport.dispose();
        };
    }, [ uri ]);

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        backendRef.current?.onMessage(event.nativeEvent.data);
    }, []);

    return {
        onMessage,
        webViewRef
    };
}
