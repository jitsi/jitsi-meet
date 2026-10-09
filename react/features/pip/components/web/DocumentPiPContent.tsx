import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import GlobalStyles from '../../../base/ui/components/GlobalStyles.web';

import { DocumentPiPView } from './DocumentPiPView';

/**
 * The properties of {@link DocumentPiPContent}.
 */
interface IProps {
    /**
     * The content to portal into the PiP window; defaults to the standard
     * {@link DocumentPiPView}. The custom Electron PiP window passes its own
     * wrapper adding the window interactions (drag, double click, dismiss).
     */
    children?: React.ReactNode;
}

/**
 * Inner component for the Document PiP.
 *
 * @param {IProps} props - The component props.
 * @returns {React.ReactElement | null}
 */
export function DocumentPiPContent({ children }: IProps) {
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
            { children ?? <DocumentPiPView /> }
        </CacheProvider>,
        pipRoot
    );
}
