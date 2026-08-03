import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import GlobalStyles from '../../../base/ui/components/GlobalStyles.web';
import { getStoredPiPWindow } from '../../functions';
import { useDocumentPiPMediaSession } from '../../hooks';

import { DocumentPiPView } from './DocumentPiPView';

/**
 * Inner component for the Document PiP.
 *
 * @returns {React.ReactElement | null}
 */
export function DocumentPiPContent() {
    useDocumentPiPMediaSession();

    const isPiPActive = useSelector((state: IReduxState) => state['features/pip'].isPiPActive);
    const pipWindow = isPiPActive ? getStoredPiPWindow() : null;
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
            <DocumentPiPView />
        </CacheProvider>,
        pipRoot
    );
}
