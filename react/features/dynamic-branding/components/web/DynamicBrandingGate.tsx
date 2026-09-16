import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { DYNAMIC_BRANDING_PENDING_CLASS, DYNAMIC_BRANDING_WAIT_TIMEOUT } from '../../constants';
import { isDynamicBrandingPending } from '../../functions.any';

/**
 * Keeps the page content invisible while the dynamic branding is being applied, so users never see
 * the default theme and icons get replaced by the branded ones. Everything keeps mounting and
 * initializing in the meantime (connection, prejoin, devices), only the paint is held back. Gives up
 * after {@link DYNAMIC_BRANDING_WAIT_TIMEOUT} so a slow branding endpoint cannot keep the page blank.
 *
 * @returns {null}
 */
export default function DynamicBrandingGate(): null {
    const pending = useSelector(isDynamicBrandingPending);
    const [ timedOut, setTimedOut ] = useState(false);

    // The clock starts the first time branding becomes pending, i.e. once the config has told us
    // there is branding to wait for, not when the app mounts.
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined;

        if (pending && !timedOut) {
            timeout = setTimeout(() => setTimedOut(true), DYNAMIC_BRANDING_WAIT_TIMEOUT);
        }

        return () => clearTimeout(timeout);
    }, [ pending, timedOut ]);

    const hidden = pending && !timedOut;

    useEffect(() => {
        document.body.classList.toggle(DYNAMIC_BRANDING_PENDING_CLASS, hidden);

        return () => document.body.classList.remove(DYNAMIC_BRANDING_PENDING_CLASS);
    }, [ hidden ]);

    return null;
}
