// @flow

import { Component } from 'react';

import { getProfile, updateProfile } from '../../base/profile';

/**
 * The type of the React {@code Component} props of {@link AbstractAppSettings}
 */
type Props = {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol,

    /**
     * The current profile object.
     */
    _profile: Object,

    /**
     * The default URL for when there is no custom URL set in the profile.
     */
    _serverURL: string,

    /**
     * The visibility prop of the settings modal.
     */
    _visible: boolean,

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<*>,

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
export class AbstractAppSettings extends Component<Props> {

    /**
     * Initializes a new {@code AbstractAppSettings} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the component.
     */
    constructor(props: Props) {
        super(props);

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
     * @protected
     * @param {string} text - The value typed in the name field.
     * @returns {void}
     */
    _onChangeDisplayName(text) {
        this._updateProfile({
            displayName: text
        });
    }

    _onChangeEmail: (string) => void;

    /**
     * Handles the email field value change.
     *
     * @protected
     * @param {string} text - The value typed in the email field.
     * @returns {void}
     */
    _onChangeEmail(text) {
        this._updateProfile({
            email: text
        });
    }

    _onChangeServerURL: (string) => void;

    /**
     * Handles the server name field value change.
     *
     * @protected
     * @param {string} text - The server URL typed in the server field.
     * @returns {void}
     */
    _onChangeServerURL(text) {
        this._updateProfile({
            serverURL: text
        });
    }

    _onStartAudioMutedChange: (boolean) => void;

    /**
     * Handles the start audio muted change event.
     *
     * @protected
     * @param {boolean} newValue - The new value for the
     * start audio muted option.
     * @returns {void}
     */
    _onStartAudioMutedChange(newValue) {
        this._updateProfile({
            startWithAudioMuted: newValue
        });
    }

    _onStartVideoMutedChange: (boolean) => void;

    /**
     * Handles the start video muted change event.
     *
     * @protected
     * @param {boolean} newValue - The new value for the
     * start video muted option.
     * @returns {void}
     */
    _onStartVideoMutedChange(newValue) {
        this._updateProfile({
            startWithVideoMuted: newValue
        });
    }

    _updateProfile: (Object) => void;

    /**
     * Updates the persisted profile on any change.
     *
     * @private
     * @param {Object} updateObject - The partial update object for the profile.
     * @returns {void}
     */
    _updateProfile(updateObject: Object) {
        this.props.dispatch(updateProfile({
            ...this.props._profile,
            ...updateObject
        }));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code AbstractAppSettings}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    const _serverURL = state['features/app'].app._getDefaultURL();
    const _profile = getProfile(state);

    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio,
        _profile,
        _serverURL,
        _visible: state['features/app-settings'].visible
    };
}
