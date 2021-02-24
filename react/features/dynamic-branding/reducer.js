// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_DYNAMIC_BRANDING_DATA,
    SET_DYNAMIC_BRANDING_FAILED,
    SET_DYNAMIC_BRANDING_READY
} from './actionTypes';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code dynamic-branding}.
 */
const STORE_NAME = 'features/dynamic-branding';

const DEFAULT_STATE = {
    /**
     * The custom background color for the LargeVideo.
     *
     * @public
     * @type {string}
     */
    backgroundColor: '',

    /**
     * The custom background image used on the LargeVideo.
     *
     * @public
     * @type {string}
     */
    backgroundImageUrl: '',

    /**
     * Flag indicating that the logo (JitsiWatermark) can be displayed.
     * This is used in order to avoid image flickering.
     *
     * @public
     * @type {boolean}
     */
    customizationReady: false,

    /**
     * Flag indicating that the dynamic branding data request has failed.
     * When the request fails there is no logo (JitsiWatermark) displayed.
     *
     * @public
     * @type {boolean}
     */
    customizationFailed: false,

    /**
     * Flag indicating that the dynamic branding has not been modified and should use
     * the default options.
     *
     * @public
     * @type {boolean}
     */
    defaultBranding: true,

    /**
     * Url for a custom page for DID numbers list.
     *
     * @public
     * @type {string}
     */
    didPageUrl: '',

    /**
     * The custom invite domain.
     *
     * @public
     * @type {string}
     */
    inviteDomain: '',

    /**
     * The custom url used when the user clicks the logo.
     *
     * @public
     * @type {string}
     */
    logoClickUrl: '',

    /**
     * The custom logo (JitisWatermark).
     *
     * @public
     * @type {string}
     */
    logoImageUrl: '',

    /**
     * Flag used to signal if the app should use a custom logo or not
     *
     * @public
     * @type {boolean}
     */
    useDynamicBrandingData: false
};

/**
 * Reduces redux actions for the purposes of the feature {@code dynamic-branding}.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_DYNAMIC_BRANDING_DATA: {
        const {
            backgroundColor,
            backgroundImageUrl,
            defaultBranding,
            didPageUrl,
            inviteDomain,
            logoClickUrl,
            logoImageUrl
        } = action.value;

        return {
            backgroundColor,
            backgroundImageUrl,
            defaultBranding,
            didPageUrl,
            inviteDomain,
            logoClickUrl,
            logoImageUrl,
            customizationFailed: false,
            customizationReady: true,
            useDynamicBrandingData: true
        };
    }
    case SET_DYNAMIC_BRANDING_FAILED: {
        return {
            ...state,
            customizationReady: true,
            customizationFailed: true,
            useDynamicBrandingData: true
        };
    }
    case SET_DYNAMIC_BRANDING_READY:
        return {
            ...state,
            customizationReady: true
        };
    }

    return state;
});
