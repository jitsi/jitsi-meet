import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { handleWindowFocus, openElectronPiPWindow } from '../../actions';
import { FOCUS_CHECK_DELAY_MS } from '../../constants';

import { DocumentPiPContent } from './DocumentPiPContent';
import { ElectronPiPView } from './ElectronPiPView';

/**
 * Controller for the custom Electron PiP window mode: opens the PiP window
 * when the meeting window loses focus and closes it when focus returns
 * (matching the legacy always-on-top behavior), and portals the PiP content
 * into the window while it is open.
 *
 * @returns {React.ReactElement}
 */
export default function ElectronPiPWindow() {
    const dispatch = useDispatch();

    useEffect(() => {
        const onWindowBlur = () => dispatch(openElectronPiPWindow());
        const onWindowFocus = () => {
            // Deferred for symmetry with the video-element PiP flow, so that any
            // pending PiP teardown events settle before the exit runs.
            setTimeout(() => {
                dispatch(handleWindowFocus());
            }, FOCUS_CHECK_DELAY_MS);
        };
        const onVisibilityChange = () => {
            if (document.hidden) {
                onWindowBlur();
            }
        };

        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Handle PiP becoming available while the app is already in the
        // background (e.g. the conference was joined while unfocused).
        if (!document.hasFocus()) {
            onWindowBlur();
        }

        return () => {
            window.removeEventListener('blur', onWindowBlur);
            window.removeEventListener('focus', onWindowFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [ dispatch ]);

    return (
        <DocumentPiPContent>
            <ElectronPiPView />
        </DocumentPiPContent>
    );
}
