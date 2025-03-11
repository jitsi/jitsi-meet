import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { SET_DYNAMIC_BRANDING_DATA } from '../../dynamic-branding/actionTypes';
import { getFeatureFlag } from '../flags/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { updateSettings } from '../settings/actions';

import { OVERWRITE_CONFIG, SET_CONFIG } from './actionTypes';
import { updateConfig } from './actions';
import { IConfig } from './configType';

/**
 * The middleware of the feature {@code base/config}.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(store, next, action);

    case SET_DYNAMIC_BRANDING_DATA:
        return _setDynamicBrandingData(store, next, action);

    case OVERWRITE_CONFIG:
        return _updateSettings(store, next, action);

    }

    return next(action);
});

/**
 * Notifies the feature {@code base/config} that the {@link SET_CONFIG} redux
 * action is being {@code dispatch}ed in a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _setConfig({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    // The reducer is doing some alterations to the config passed in the action,
    // so make sure it's the final state by waiting for the action to be
    // reduced.
    const result = next(action);
    const state = getState();

    // Update the config with user defined settings.
    const settings = state['features/base/settings'];
    const config: IConfig = {};

    if (typeof settings.disableP2P !== 'undefined') {
        config.p2p = { enabled: !settings.disableP2P };
    }

    const resolutionFlag = getFeatureFlag(state, 'resolution');

    if (typeof resolutionFlag !== 'undefined') {
        config.resolution = resolutionFlag;
    }

    if (action.config.doNotFlipLocalVideo === true) {
        dispatch(updateSettings({
            localFlipX: false
        }));
    }

    if (action.config.disableSelfView !== undefined) {
        dispatch(updateSettings({
            disableSelfView: action.config.disableSelfView
        }));
    }

    if (action.config.filmstrip?.stageFilmstripParticipants !== undefined) {
        dispatch(updateSettings({
            maxStageParticipants: action.config.filmstrip.stageFilmstripParticipants
        }));
    }

    dispatch(updateConfig(config));

    // FIXME On Web we rely on the global 'config' variable which gets altered
    // multiple times, before it makes it to the reducer. At some point it may
    // not be the global variable which is being modified anymore due to
    // different merge methods being used along the way. The global variable
    // must be synchronized with the final state resolved by the reducer.
    if (typeof window.config !== 'undefined') {
        window.config = state['features/base/config'];
    }

    return result;
}

/**
 * Updates config based on dynamic branding data.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _setDynamicBrandingData({ dispatch }: IStore, next: Function, action: AnyAction) {
    const config: IConfig = {};
    const {
        customParticipantMenuButtons,
        customToolbarButtons,
        downloadAppsUrl,
        etherpadBase,
        liveStreamingDialogUrls = {},
        preCallTest = {},
        salesforceUrl,
        userDocumentationUrl,
        peopleSearchUrl,
    } = action.value;

    const { helpUrl, termsUrl, dataPrivacyUrl } = liveStreamingDialogUrls;

    if (helpUrl || termsUrl || dataPrivacyUrl) {
        config.liveStreaming = {};
        if (helpUrl) {
            config.liveStreaming.helpLink = helpUrl;
        }

        if (termsUrl) {
            config.liveStreaming.termsLink = termsUrl;
        }

        if (dataPrivacyUrl) {
            config.liveStreaming.dataPrivacyLink = dataPrivacyUrl;
        }
    }

    if (downloadAppsUrl || userDocumentationUrl) {
        config.deploymentUrls = {};

        if (downloadAppsUrl) {
            config.deploymentUrls.downloadAppsUrl = downloadAppsUrl;
        }

        if (userDocumentationUrl) {
            config.deploymentUrls.userDocumentationURL = userDocumentationUrl;
        }
    }

    if (salesforceUrl) {
        config.salesforceUrl = salesforceUrl;
    }

    if (peopleSearchUrl) {
        config.peopleSearchUrl = peopleSearchUrl;
    }

    const { enabled, iceUrl } = preCallTest;

    if (typeof enabled === 'boolean') {
        config.prejoinConfig = {
            preCallTestEnabled: enabled
        };
    }

    if (etherpadBase) {
        // eslint-disable-next-line camelcase
        config.etherpad_base = etherpadBase;
    }

    if (iceUrl) {
        config.prejoinConfig = config.prejoinConfig || {};
        config.prejoinConfig.preCallTestICEUrl = iceUrl;
    }

    if (customToolbarButtons) {
        config.customToolbarButtons = customToolbarButtons;
    }

    if (customParticipantMenuButtons) {
        config.customParticipantMenuButtons = customParticipantMenuButtons;
    }

    dispatch(updateConfig(config));

    return next(action);
}

/**
 * Updates settings based on some config values.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _updateSettings({ dispatch }: IStore, next: Function, action: AnyAction) {
    const { config: { doNotFlipLocalVideo } } = action;

    if (doNotFlipLocalVideo === true) {
        dispatch(updateSettings({
            localFlipX: false
        }));
    }

    return next(action);
}
