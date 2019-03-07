// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import {
    _abstractMapStateToProps
} from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    Button,
    Container,
    Image,
    LoadingIndicator,
    Switch,
    Text
} from '../../../base/react';
import { ColorPalette, StyleType } from '../../../base/styles';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox';

import {
    default as styles,
    DROPBOX_LOGO,
    JITSI_LOGO
} from './styles';

import { getRecordingDurationEstimation } from '../../functions';

type Props = {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Whether to show file recordings service, even if integrations
     * are enabled.
     */
    fileRecordingsServiceEnabled: boolean,

    /**
     * If true the content related to the integrations will be shown.
     */
    integrationsEnabled: boolean,

    /**
     * <tt>true</tt> if we have valid oauth token.
     */
    isTokenValid: boolean,

    /**
     * <tt>true</tt> if we are in process of validating the oauth token.
     */
    isValidating: boolean,

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft: ?number,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The display name of the user's Dropbox account.
     */
    userName: ?string,
};

/**
 * State of the component.
 */
type State = {

    /**
     * True if the jitsi recording service is selected to be used.
     */
    jitsiRecordingSelected: boolean,

    /**
     * True if dropbox is selected for storing the recording.
     */
    dropboxRecordingSelected: boolean
};


/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialogContent extends Component<Props, State> {
    /**
     * Initializes a new {@code StartRecordingDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSignIn = this._onSignIn.bind(this);
        this._onSignOut = this._onSignOut.bind(this);
        this._onDropboxSwitchChange
            = this._onDropboxSwitchChange.bind(this);
        this._onRecordingServiceSwitchChange
            = this._onRecordingServiceSwitchChange.bind(this);

        // enable jitsi recording if force enabled
        // or if there are no integrations enabled.
        const enableJitsiRecordingService
            = this.props.fileRecordingsServiceEnabled === true
                || !this.props.integrationsEnabled;

        this.state = {
            jitsiRecordingSelected: enableJitsiRecordingService,
            dropboxRecordingSelected:
                this.props.integrationsEnabled
                    && !enableJitsiRecordingService
        };
    }

    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        return (
            <Container
                className = 'recording-dialog'
                style = { styles.container }>
                { this._renderNoIntegrationsContent() }
                { this._renderIntegrationsContent() }
            </Container>
        );
    }

    /**
     * Renders the content in case no integrations were enabled.
     *
     * @returns {React$Component}
     */
    _renderNoIntegrationsContent() {

        // show the non integrations part only if fileRecordingsServiceEnabled
        // is enabled or when there are no integrations enabled
        if (!(this.props.fileRecordingsServiceEnabled
            || !this.props.integrationsEnabled)) {
            return null;
        }

        const { _dialogStyles, isValidating, t } = this.props;

        const switchContent
            = this.props.integrationsEnabled
                ? (
                    <Switch
                        className = 'recording-switch'
                        disabled = { isValidating }
                        onValueChange
                            = { this._onRecordingServiceSwitchChange }
                        style = { styles.switch }
                        trackColor = {{ false: ColorPalette.lightGrey }}
                        value = { this.state.jitsiRecordingSelected } />
                ) : null;

        return (
            <Container
                className = 'recording-header'
                style = { styles.header }>
                <Container className = 'recording-icon-container'>
                    <Image
                        className = 'recording-icon'
                        src = { JITSI_LOGO }
                        style = { styles.recordingIcon } />
                </Container>
                <Text
                    className = 'recording-title'
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t('recording.serviceDescription') }
                </Text>
                { switchContent }
            </Container>
        );
    }

    /**
     * Renders the content in case integrations were enabled.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderIntegrationsContent() {
        if (!this.props.integrationsEnabled) {
            return null;
        }

        const { _dialogStyles, isTokenValid, isValidating, t } = this.props;

        let content = null;
        let switchContent = null;

        if (isValidating) {
            content = this._renderSpinner();
            switchContent = <Container className = 'recording-switch' />;
        } else if (isTokenValid) {
            content = this._renderSignOut();
            switchContent = (
                <Container className = 'recording-switch'>
                    <Button
                        onValueChange = { this._onSignOut }
                        style = { styles.signButton }>
                        { t('recording.signOut') }
                    </Button>
                </Container>
            );

        } else {
            switchContent = (
                <Container className = 'recording-switch'>
                    <Button
                        onValueChange = { this._onSignIn }
                        style = { styles.signButton }>
                        { t('recording.signIn') }
                    </Button>
                </Container>
            );
        }

        if (this.props.fileRecordingsServiceEnabled) {
            switchContent = (
                <Switch
                    className = 'recording-switch'
                    disabled = { isValidating }
                    onValueChange = { this._onDropboxSwitchChange }
                    style = { styles.switch }
                    trackColor = {{ false: ColorPalette.lightGrey }}
                    value = { this.state.dropboxRecordingSelected } />
            );
        }

        return (
            <Container>
                <Container
                    className = 'recording-header'
                    style = { styles.header }>
                    <Container
                        className = 'recording-icon-container'>
                        <Image
                            className = 'recording-icon'
                            src = { DROPBOX_LOGO }
                            style = { styles.recordingIcon } />
                    </Container>
                    <Text
                        className = 'recording-title'
                        style = {{
                            ..._dialogStyles.text,
                            ...styles.title
                        }}>
                        { t('recording.authDropboxText') }
                    </Text>
                    { switchContent }
                </Container>
                <Container
                    className = 'authorization-panel'>
                    { content }
                </Container>
            </Container>
        );
    }

    _onDropboxSwitchChange: boolean => void;
    _onRecordingServiceSwitchChange: boolean => void;

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onRecordingServiceSwitchChange() {

        // act like group, cannot toggle off
        if (this.state.jitsiRecordingSelected) {
            return;
        }

        this.setState({
            jitsiRecordingSelected: true,
            dropboxRecordingSelected: false
        });

        if (this.props.isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onDropboxSwitchChange() {
        // act like group, cannot toggle off
        if (this.state.dropboxRecordingSelected) {
            return;
        }

        this.setState({
            jitsiRecordingSelected: false,
            dropboxRecordingSelected: true
        });

        if (!this.props.isTokenValid) {
            this._onSignIn();
        }
    }

    /**
     * Renders a spinner component.
     *
     * @returns {React$Component}
     */
    _renderSpinner() {
        return (
            <LoadingIndicator
                isCompleting = { false }
                size = 'medium' />
        );
    }

    /**
     * Renders the screen with the account information of a logged in user.
     *
     * @returns {React$Component}
     */
    _renderSignOut() {
        const { spaceLeft, t, userName } = this.props;
        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <Container>
                <Container
                    className = 'logged-in-panel'
                    style = { styles.loggedIn }>
                    <Container>
                        <Text style = { styles.text }>
                            { t('recording.loggedIn', { userName }) }
                        </Text>
                    </Container>
                    <Container>
                        <Text style = { styles.text }>
                            {
                                t('recording.availableSpace', {
                                    spaceLeft,
                                    duration
                                })
                            }
                        </Text>
                    </Container>
                </Container>
            </Container>
        );
    }

    _onSignIn: () => {};

    /**
     * Sings in a user.
     *
     * @returns {void}
     */
    _onSignIn() {
        sendAnalytics(
            createRecordingDialogEvent('start', 'signIn.button')
        );
        this.props.dispatch(authorizeDropbox());
    }

    _onSignOut: () => {};

    /**
     * Sings out an user from dropbox.
     *
     * @returns {void}
     */
    _onSignOut() {
        sendAnalytics(
            createRecordingDialogEvent('start', 'signOut.button')
        );
        this.props.dispatch(updateDropboxToken());
    }
}

export default translate(
    connect(_abstractMapStateToProps)(StartRecordingDialogContent));
