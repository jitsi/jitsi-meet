import { IStore } from '../../app/types';
import { APP_WILL_MOUNT } from '../app/actionTypes';
import { setAudioOnly } from '../audio-only/actions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { SETTINGS_UPDATED } from './actionTypes';
import { handleCallIntegrationChange, handleCrashReportingChange } from './functions.native';
import { ISettingsState } from './reducer';

import './middleware.any';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _initializeCallIntegration(store);
        break;
    case SETTINGS_UPDATED:
        _maybeHandleCallIntegrationChange(action);
        _maybeCrashReportingChange(action);
        _maybeSetAudioOnly(store, action);
        break;
    }

    return result;
});

/**
 * Initializes the audio device handler based on the `disableCallIntegration` setting.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _initializeCallIntegration({ getState }: IStore) {
    const { disableCallIntegration } = getState()['features/base/settings'];

    if (typeof disableCallIntegration === 'boolean') {
        handleCallIntegrationChange(disableCallIntegration);
    }
}

/**
 * Handles a change in the `disableCallIntegration` setting.
 *
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeHandleCallIntegrationChange({ settings: { disableCallIntegration } }: {
    settings: Partial<ISettingsState>;
}) {
    if (typeof disableCallIntegration === 'boolean') {
        handleCallIntegrationChange(disableCallIntegration);
    }
}

/**
 * Handles a change in the `disableCrashReporting` setting.
 *
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeCrashReportingChange({ settings: { disableCrashReporting } }: {
    settings: Partial<ISettingsState>;
}) {
    if (typeof disableCrashReporting === 'boolean') {
        handleCrashReportingChange(disableCrashReporting);
    }
}

/**
 * Updates {@code startAudioOnly} flag if it's updated in the settings.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeSetAudioOnly(
        { dispatch }: IStore,
        { settings: { startAudioOnly } }: { settings: Partial<ISettingsState>; }) {
    if (typeof startAudioOnly === 'boolean') {
        dispatch(setAudioOnly(startAudioOnly));
    }
}
