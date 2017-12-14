// @flow

import { Component } from 'react';

import { hideAppSettings } from '../actions';
import { getProfile, updateProfile } from '../../base/profile';

/**
* The type of the React {@code Component} props of {@link AbstractAppSettings}
*/
type Props = {

    /**
    * The current profile object.
    */
    _profile: Object,

    /**
    * The visibility prop of the settings modal.
    */
    _visible: boolean,

    /**
    * Redux store dispatch function.
    */
    dispatch: Dispatch<*>
};

/**
 * The type of the React {@code Component} state of {@link AbstractAppSettings}.
 */
type State = {

    /**
    * The display name field value on the settings screen.
    */
    displayName: string,

    /**
    * The email field value on the settings screen.
    */
    email: string,

    /**
    * The server url field value on the settings screen.
    */
    serverURL: string,

    /**
    * The start audio muted switch value on the settings screen.
    */
    startWithAudioMuted: boolean,

    /**
    * The start video muted switch value on the settings screen.
    */
    startWithVideoMuted: boolean
}

/**
 * Base (abstract) class for container component rendering
 * the app settings page.
 *
 * @abstract
 */
export class AbstractAppSettings extends Component<Props, State> {

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
        this._onChangeServerName = this._onChangeServerName.bind(this);
        this._onRequestClose = this._onRequestClose.bind(this);
        this._onSaveDisplayName = this._onSaveDisplayName.bind(this);
        this._onSaveEmail = this._onSaveEmail.bind(this);
        this._onSaveServerName = this._onSaveServerName.bind(this);
        this._onStartAudioMutedChange
            = this._onStartAudioMutedChange.bind(this);
        this._onStartVideoMutedChange
            = this._onStartVideoMutedChange.bind(this);
    }

    /**
     * Invokes React's {@link Component#componentWillReceiveProps()} to make
     * sure we have the state Initialized on component mount.
     *
     * @inheritdoc
     */
    componentWillMount() {
        this._updateStateFromProps(this.props);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}. Invoked
     * before this mounted component receives new props.
     *
     * @inheritdoc
     * @param {Props} nextProps - New props component will receive.
     */
    componentWillReceiveProps(nextProps: Props) {
        this._updateStateFromProps(nextProps);
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
        this.setState({
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
        this.setState({
            email: text
        });
    }

    _onChangeServerName: (string) => void;

    /**
    * Handles the server name field value change.
    *
    * @protected
    * @param {string} text - The server URL typed in the server field.
    * @returns {void}
    */
    _onChangeServerName(text) {
        this.setState({
            serverURL: text
        });
    }

    _onRequestClose: () => void;

    /**
    * Handles the hardware back button.
    *
    * @returns {void}
    */
    _onRequestClose() {
        this.props.dispatch(hideAppSettings());
    }

    _onSaveDisplayName: () => void;

    /**
    * Handles the display name field onEndEditing.
    *
    * @protected
    * @returns {void}
    */
    _onSaveDisplayName() {
        this._updateProfile({
            displayName: this.state.displayName
        });
    }

    _onSaveEmail: () => void;

    /**
    * Handles the email field onEndEditing.
    *
    * @protected
    * @returns {void}
    */
    _onSaveEmail() {
        this._updateProfile({
            email: this.state.email
        });
    }

    _onSaveServerName: () => void;

    /**
    * Handles the server name field onEndEditing.
    *
    * @protected
    * @returns {void}
    */
    _onSaveServerName() {
        let serverURL;

        if (this.state.serverURL.endsWith('/')) {
            serverURL = this.state.serverURL.substr(
                0, this.state.serverURL.length - 1
            );
        } else {
            serverURL = this.state.serverURL;
        }

        this._updateProfile({
            defaultURL: serverURL
        });
        this.setState({
            serverURL
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
        this.setState({
            startWithAudioMuted: newValue
        });

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
        this.setState({
            startWithVideoMuted: newValue
        });

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

    _updateStateFromProps: (Object) => void;

    /**
    * Updates the component state when (new) props are received.
    *
    * @private
    * @param {Object} props - The component's props.
    * @returns {void}
    */
    _updateStateFromProps(props) {
        this.setState({
            displayName: props._profile.displayName,
            email: props._profile.email,
            serverURL: props._profile.defaultURL,
            startWithAudioMuted: props._profile.startWithAudioMuted,
            startWithVideoMuted: props._profile.startWithVideoMuted
        });
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
    return {
        _profile: getProfile(state),
        _visible: state['features/app-settings'].visible
    };
}
