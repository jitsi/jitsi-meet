import { useCallback, useEffect, useRef, useState } from 'react';

import { getCaptureElement, requestAccess } from './functions';
import { IPermissionPrompt } from './reducer';

interface IOptions extends IPermissionPrompt {

    /**
     * Hides the dialog or the popover holding the explanation.
     */
    close: () => void;
}

/**
 * Handles the answers to an explanation of the microphone and camera request.
 *
 * @param {IOptions} options - The options.
 * @returns {Object}
 */
export function usePermissionPrompt({ close, kinds, onDone, otherKind }: IOptions) {
    const done = useRef(false);

    // The browser's own button replaces the allow buttons where it's supported.
    const [ showCaptureElement, setShowCaptureElement ] = useState(() =>
        Boolean(getCaptureElement(kinds) && (!otherKind || getCaptureElement([ ...kinds, otherKind ]))));

    const finish = useCallback((allowed: boolean) => {
        if (!done.current) {
            done.current = true;
            onDone(allowed);
        }
    }, [ onDone ]);

    // Closed without an answer, e.g. replaced by another dialog.
    useEffect(() => () => finish(false), []);

    const allow = useCallback(() => {
        finish(true);
        close();
    }, [ close, finish ]);

    // A single prompt for both, the device that isn't being unmuted stays off.
    const allowBoth = useCallback(async () => {
        otherKind && await requestAccess([ ...kinds, otherKind ]);
        allow();
    }, [ allow, kinds, otherKind ]);

    const cancel = useCallback(() => finish(false), [ finish ]);
    const onCaptureElementUnsupported = useCallback(() => setShowCaptureElement(false), []);

    return {
        allow,
        allowBoth,
        cancel,
        onCaptureElementUnsupported,
        showCaptureElement
    };
}
