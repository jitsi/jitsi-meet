import { useCallback, useRef } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { goBack } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';

import { API_SCOPE, EVENT_CLOSE_PANEL } from './apiConstants';
import logger from './logger';
import { EventHandler, ICustomPanelEvent } from './types';

interface INavigation {
    isFocused: () => boolean;
}

/**
 * Hook that owns the WebView bridge used to talk to the advisor app on native.
 *
 * The bridge has no handshake, so the advisor wraps every message with
 * `{ scope: API_SCOPE, ...envelope }` and this hook drops anything that
 * doesn't carry the matching scope, as a guard against stray `postMessage`
 * calls from other scripts in the page.
 *
 * @param {string} uri - The advisor URL currently loaded in the WebView, used only for logging.
 * @param {INavigation} navigation - The screen's navigation object.
 * @returns {Object}
 */
export function useCustomPanelApi(uri: string, navigation: INavigation) {
    const webViewRef = useRef<WebView>(null);

    const eventHandlersRef = useRef<Record<string, EventHandler>>({
        [EVENT_CLOSE_PANEL]: () => {
            // A late close-panel after a manual back press must not pop a second screen.
            if (navigation.isFocused()) {
                goBack();
            }
        }
    });

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        let payload: any;

        try {
            payload = JSON.parse(event.nativeEvent.data);
        } catch (error) {
            logger.error(`Failed to parse message from ${uri}`, error);

            return;
        }

        if (payload?.scope !== API_SCOPE) {
            return;
        }

        const { name } = payload;

        if (typeof name !== 'string') {
            return;
        }

        const handler = eventHandlersRef.current[name];

        if (handler) {
            handler(payload);
        } else {
            logger.debug(`Unknown event received from ${uri}: ${name}`);
        }
    }, [ uri, navigation ]);

    const sendEvent = useCallback((envelope: ICustomPanelEvent) => {
        webViewRef.current?.postMessage(JSON.stringify({
            scope: API_SCOPE,
            ...envelope
        }));
    }, []);

    return {
        onMessage,
        sendEvent,
        webViewRef
    };
}
