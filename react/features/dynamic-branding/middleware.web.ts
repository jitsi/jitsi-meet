import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    SET_DYNAMIC_BRANDING_DATA,
    SET_DYNAMIC_BRANDING_FAILED,
    SET_DYNAMIC_BRANDING_ICONS,
    SET_DYNAMIC_BRANDING_READY
} from './actionTypes';
import { fetchCustomBrandingData } from './actions.any';
import { DYNAMIC_BRANDING_PENDING_CLASS, DYNAMIC_BRANDING_WAIT_TIMEOUT } from './constants';
import { isDynamicBrandingPending } from './functions.any';
import { createMuiBrandingTheme } from './functions.web';

import './middleware.any';

/**
 * Ends the wait for the branding when it takes too long, so a slow or failing branding endpoint
 * cannot keep the page blank.
 */
let waitTimeout: ReturnType<typeof setTimeout> | undefined;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        const result = next(action);

        // The config tells whether there is branding to wait for. Checking "pending" rather than
        // "configured" also keeps a later SET_CONFIG (e.g. a shard change) from hiding a page whose
        // branding is already applied.
        if (isDynamicBrandingPending(store.getState())) {
            holdFirstPaint();
        }

        store.dispatch(fetchCustomBrandingData());

        return result;
    }
    case SET_DYNAMIC_BRANDING_DATA: {
        const { customTheme } = action.value;

        if (customTheme) {
            action.value.muiBrandedTheme = createMuiBrandingTheme(customTheme);
        }

        // Falls through: the data may or may not complete the branding, depending on the icons.
    }

    // eslint-disable-next-line no-fallthrough
    case SET_DYNAMIC_BRANDING_FAILED:
    case SET_DYNAMIC_BRANDING_ICONS:
    case SET_DYNAMIC_BRANDING_READY: {
        const result = next(action);

        if (!isDynamicBrandingPending(store.getState())) {
            releaseFirstPaint();
        }

        return result;
    }
    }

    return next(action);
});

/**
 * Keeps the page content invisible until the dynamic branding has been applied, so users never see
 * the default theme and icons get replaced by the branded ones. Nothing else is held back: the app
 * keeps mounting and initializing (connection, prejoin, devices), only the paint waits, and at most
 * for {@link DYNAMIC_BRANDING_WAIT_TIMEOUT}.
 *
 * @returns {void}
 */
function holdFirstPaint(): void {
    document.body.classList.add(DYNAMIC_BRANDING_PENDING_CLASS);
    clearTimeout(waitTimeout);
    waitTimeout = setTimeout(releaseFirstPaint, DYNAMIC_BRANDING_WAIT_TIMEOUT);
}

/**
 * Lets the page paint, either because the branding has been applied or because waiting for it
 * took too long.
 *
 * @returns {void}
 */
function releaseFirstPaint(): void {
    clearTimeout(waitTimeout);
    waitTimeout = undefined;
    document.body.classList.remove(DYNAMIC_BRANDING_PENDING_CLASS);
}
