import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import GlobalStyles from '../../../base/ui/components/GlobalStyles.web';

import { PiPView } from './PiPView';

/**
 * The properties of {@link PiPWindowPortal}.
 */
interface IProps {
    /**
     * The content to portal into the PiP window; defaults to the standard
     * {@link PiPView}. The custom Electron PiP window passes its own
     * wrapper adding the window interactions (drag, double click, dismiss).
     */
    children?: React.ReactNode;
}

/**
 * Renders the PiP content into the window held in state as pipWindow, whichever
 * implementation opened it: the browser's Document PiP window or the custom
 * Electron popup. The React tree keeps running in the meeting page; only the
 * DOM lands in the other window, with styles served by an emotion cache bound
 * to that window's head.
 *
 * @param {IProps} props - The component props.
 * @returns {React.ReactElement | null}
 */
export function PiPWindowPortal({ children }: IProps) {
    const pipWindow = useSelector((state: IReduxState) => state['features/pip'].pipWindow);
    const pipCache = useMemo(() => {
        if (!pipWindow || pipWindow.closed) {
            return null;
        }

        return createCache({
            key: 'jitsi-pip',
            container: pipWindow.document.head
        });
    }, [ pipWindow ]);

    useEffect(() => () => {
        pipCache?.sheet.flush();
    }, [ pipCache ]);

    const pipRoot = pipWindow?.document.getElementById('pip-root');

    if (!pipCache || !pipRoot) {
        return null;
    }

    return createPortal(
        <CacheProvider value = { pipCache }>
            <GlobalStyles />
            { children ?? <PiPView /> }
        </CacheProvider>,
        pipRoot
    );
}
