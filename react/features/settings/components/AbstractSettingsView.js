// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

import { getDefaultURL } from '../../app/functions';
import { updateSettings } from '../../base/settings';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractSettingsView}.
 */
export type Props = {

    /**
     * The default URL for when there is no custom URL set in the settings.
     *
     * @protected
     */
    _serverURL: string,

    /**
     * The current settings object.
     */
    _settings: Object,

    /**
     * Whether {@link AbstractSettingsView} is visible.
     *
     * @protected
     */
    _visible: boolean,

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * Base (abstract) class for container component rendering the app settings
 * page.
 *
 * @abstract
 */
export class AbstractSettingsView<P: Props, S: *> extends Component<P, S> {

    /**
     * Initializes a new {@code AbstractSettingsView} instance.
     *
     * @param {P} props - The React {@code Component} props to initialize
     * the component.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onChangeDisplayName = this._onChangeDisplayName.bind(this);
        this._onChangeEmail = this._onChangeEmail.bind(this);
        this._onChangeServerURL = this._onChangeServerURL.bind(this);
        this._onStartAudioMutedChange
            = this._onStartAudioMutedChange.bind(this);
        this._onStartVideoMutedChange
            = this._onStartVideoMutedChange.bind(this);
    }

    _onChangeDisplayName: (string) => void;

    /**
     * Handles the display name field value change.
     *
     * @param {string} text - The value typed in the name field.
     * @protected
     * @returns {void}
     */
    _onChangeDisplayName(text) {
        this._updateSettings({
            displayName: text
        });
    }

    _onChangeEmail: (string) => void;

    /**
     * Handles the email field value change.
     *
     * @param {string} text - The value typed in the email field.
     * @protected
     * @returns {void}
     */
    _onChangeEmail(text) {
        this._updateSettings({
            email: text
        });
    }

    _onChangeServerURL: (string) => void;

    /**
     * Handles the server name field value change.
     *
     * @param {string} text - The server URL typed in the server field.
     * @protected
     * @returns {void}
     */
    _onChangeServerURL(text) {
        this._updateSettings({
            serverURL: text
        });
    }

    _onStartAudioMutedChange: (boolean) => void;

    /**
     * Handles the start audio muted change event.
     *
     * @param {boolean} newValue - The new value for the start audio muted
     * option.
     * @protected
     * @returns {void}
     */
    _onStartAudioMutedChange(newValue) {
        this._updateSettings({
            startWithAudioMuted: newValue
        });
    }

    _onStartVideoMutedChange: (boolean) => void;

    /**
     * Handles the start video muted change event.
     *
     * @param {boolean} newValue - The new value for the start video muted
     * option.
     * @protected
     * @returns {void}
     */
    _onStartVideoMutedChange(newValue) {
        this._updateSettings({
            startWithVideoMuted: newValue
        });
    }

    _updateSettings: (Object) => void;

    /**
     * Updates the persisted settings on any change.
     *
     * @param {Object} updateObject - The partial update object for the
     * settings.
     * @private
     * @returns {void}
     */
    _updateSettings(updateObject: Object) {
        this.props.dispatch(updateSettings(updateObject));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code AbstractSettingsView}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _serverURL: string,
 *     _settings: Object,
 *     _visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _serverURL: getDefaultURL(state),
        _settings: state['features/base/settings'],
        _visible: state['features/settings'].visible
    };
}
