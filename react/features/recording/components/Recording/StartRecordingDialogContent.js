// @flow

import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { Component } from 'react';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
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
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox';
import { isVpaasMeeting } from '../../../jaas/functions';
import { RECORDING_TYPES } from '../../constants';
import { getRecordingDurationEstimation } from '../../functions';

import { DROPBOX_LOGO, ICON_CLOUD, JITSI_LOGO, TRACK_COLOR } from './styles';

type Props = {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType,

    /**
     * The color-schemed stylesheet of this component.
     */
    _styles: StyleType,

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

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
     * Whether to show the possibility to share file recording with other people (e.g. Meeting participants), based on
     * the actual implementation on the backend.
     */
    fileRecordingsServiceSharingEnabled: boolean,

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
     * Whether or not the current meeting is a vpaas one.
     */
    isVpaas: boolean,

    /**
     * The function will be called when there are changes related to the
     * switches.
     */
    onChange: Function,

    /**
     * Callback to be invoked on sharing setting change.
     */
    onSharingSettingChanged: Function,

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: ?string,

    /**
     * Boolean to set file recording sharing on or off.
     */
    sharingSetting: boolean,

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
    userName: ?string
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        root: {
            flex: 0,
            flexDirection: 'column'
        },
        authorizationPanel: {
            display: 'flex',
            flexDirection: 'column',
            margin: '0 40px 10px 40px',
            paddingBottom: '10px'
        },
        header: {
            display: 'flex',
            flex: '0',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: theme.spacing(5)
        },
        headerLine: {
            borderTop: '1px solid #5e6d7a'
        },
        icon: {
            width: '32px',
            height: '32px',
            objectFit: 'contain'
        },
        iconContainer: {
            display: 'inline-flex',
            alignItems: 'center'
        },
        loggedInPanel: {
            padding: '10px'
        },
        title: {
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '16px',
            marginLeft: '16px'
        },
        switch: {
            marginLeft: 'auto'
        }
    };
};

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @augments Component
 */
class StartRecordingDialogContent extends Component<Props> {
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
        this._onDropboxSwitchChange = this._onDropboxSwitchChange.bind(this);
        this._onRecordingServiceSwitchChange = this._onRecordingServiceSwitchChange.bind(this);
    }

    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        // eslint-disable-next-line no-shadow
        const { _styles: styles, classes } = this.props;

        return (
            <Container
                className = { classes.root }
                style = { styles.container }>
                { this._renderNoIntegrationsContent() }
                { this._renderIntegrationsContent() }
                { this._renderFileSharingContent() }
            </Container>
        );
    }

    /**
     * Renders the file recording service sharing options, if enabled.
     *
     * @returns {React$Component}
     */
    _renderFileSharingContent() {
        const { fileRecordingsServiceSharingEnabled, isVpaas, selectedRecordingService } = this.props;

        if (!fileRecordingsServiceSharingEnabled
            || isVpaas
            || selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE) {
            return null;
        }

        const {
            _dialogStyles,

            // eslint-disable-next-line no-shadow
            _styles: styles,
            classes,
            isValidating,
            onSharingSettingChanged,
            sharingSetting,
            t
        } = this.props;

        return (
            <Container
                className = { classes.header }
                key = 'fileSharingSetting'
                style = { [
                    styles.header,
                    _dialogStyles.topBorderContainer
                ] }>
                <Container className = { classes.iconContainer }>
                    <Image
                        className = { classes.icon }
                        src = { ICON_CLOUD }
                        style = { styles.recordingIcon } />
                </Container>
                <Text
                    className = { classes.title }
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t('recording.fileSharingdescription') }
                </Text>
                <Switch
                    className = { classes.switch }
                    disabled = { isValidating }
                    onValueChange
                        = { onSharingSettingChanged }
                    style = { styles.switch }
                    trackColor = {{ false: TRACK_COLOR }}
                    value = { sharingSetting } />
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

        // eslint-disable-next-line no-shadow
        const { _dialogStyles, _styles: styles, classes, isValidating, isVpaas, t } = this.props;

        const switchContent
            = this.props.integrationsEnabled
                ? (
                    <Switch
                        className = { classes.switch }
                        disabled = { isValidating }
                        onValueChange = { this._onRecordingServiceSwitchChange }
                        style = { styles.switch }
                        trackColor = {{ false: TRACK_COLOR }}
                        value = { this.props.selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE } />
                ) : null;

        const icon = isVpaas ? ICON_CLOUD : JITSI_LOGO;
        const label = isVpaas ? t('recording.serviceDescriptionCloud') : t('recording.serviceDescription');

        return (
            <Container
                className = { classes.header }
                key = 'noIntegrationSetting'
                style = { styles.header }>
                <Container className = { classes.iconContainer }>
                    <Image
                        className = { classes.icon }
                        src = { icon }
                        style = { styles.recordingIcon } />
                </Container>
                <Text
                    className = { classes.title }
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { label }
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

        // eslint-disable-next-line no-shadow
        const { _dialogStyles, _styles: styles, classes, isTokenValid, isValidating, t } = this.props;

        let content = null;
        let switchContent = null;

        if (isValidating) {
            content = this._renderSpinner();
            switchContent = <Container className = { classes.switch } />;
        } else if (isTokenValid) {
            content = this._renderSignOut();
            switchContent = (
                <Container className = { classes.switch }>
                    <Button
                        onValueChange = { this._onSignOut }
                        style = { styles.signButton }>
                        { t('recording.signOut') }
                    </Button>
                </Container>
            );

        } else {
            switchContent = (
                <Container className = { classes.switch }>
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
                    className = { classes.switch }
                    disabled = { isValidating }
                    onValueChange = { this._onDropboxSwitchChange }
                    style = { styles.switch }
                    trackColor = {{ false: TRACK_COLOR }}
                    value = { this.props.selectedRecordingService
                        === RECORDING_TYPES.DROPBOX } />
            );
        }

        return (
            <Container>
                <Container
                    className = { clsx(classes.header, classes.headerLine) }
                    style = { styles.header }>
                    <Container
                        className = { classes.iconContainer }>
                        <Image
                            className = { classes.icon }
                            src = { DROPBOX_LOGO }
                            style = { styles.recordingIcon } />
                    </Container>
                    <Text
                        className = { classes.title }
                        style = {{
                            ..._dialogStyles.text,
                            ...styles.title
                        }}>
                        { t('recording.authDropboxText') }
                    </Text>
                    { switchContent }
                </Container>
                <Container
                    className = { classes.authorizationPanel }>
                    { content }
                </Container>
            </Container>
        );
    }

    _onDropboxSwitchChange: () => void;
    _onRecordingServiceSwitchChange: () => void;

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onRecordingServiceSwitchChange() {
        const {
            isTokenValid,
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService
                === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return;
        }

        onChange(RECORDING_TYPES.JITSI_REC_SERVICE);

        if (isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onDropboxSwitchChange() {
        const {
            isTokenValid,
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService
                === RECORDING_TYPES.DROPBOX) {
            return;
        }

        onChange(RECORDING_TYPES.DROPBOX);

        if (!isTokenValid) {
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
                size = 'small' />
        );
    }

    /**
     * Renders the screen with the account information of a logged in user.
     *
     * @returns {React$Component}
     */
    _renderSignOut() {
        // eslint-disable-next-line no-shadow
        const { _styles: styles, classes, spaceLeft, t, userName } = this.props;
        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <Container>
                <Container
                    className = { classes.loggedInPanel }
                    style = { styles.loggedIn }>
                    <Container>
                        <Text
                            style = { [
                                styles.text,
                                styles.recordingText
                            ] }>
                            { t('recording.loggedIn', { userName }) }
                        </Text>
                    </Container>
                    <Container>
                        <Text
                            style = { [
                                styles.text,
                                styles.recordingText
                            ] }>
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

    _onSignIn: () => void;

    /**
     * Sings in a user.
     *
     * @returns {void}
     */
    _onSignIn() {
        sendAnalytics(createRecordingDialogEvent('start', 'signIn.button'));
        this.props.dispatch(authorizeDropbox());
    }

    _onSignOut: () => void;

    /**
     * Sings out an user from dropbox.
     *
     * @returns {void}
     */
    _onSignOut() {
        sendAnalytics(createRecordingDialogEvent('start', 'signOut.button'));
        this.props.dispatch(updateDropboxToken());
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        isVpaas: isVpaasMeeting(state),
        _styles: ColorSchemeRegistry.get(state, 'StartRecordingDialogContent')
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(StartRecordingDialogContent)));
