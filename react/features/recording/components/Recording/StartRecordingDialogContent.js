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
    Container,
    Image,
    LoadingIndicator,
    Switch,
    Text
} from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { Button } from '../../../base/ui';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox';
import { isVpaasMeeting } from '../../../jaas/functions';
import { RECORDING_TYPES } from '../../constants';
import { getRecordingDurationEstimation, supportsLocalRecording } from '../../functions';

import {
    DROPBOX_LOGO,
    ICON_CLOUD,
    ICON_INFO,
    ICON_USERS,
    LOCAL_RECORDING,
    TRACK_COLOR
} from './styles';

type Props = {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType,

    /**
     * Whether to hide the storage warning or not.
     */
    _hideStorageWarning: boolean,

    /**
     * Whether local recording is enabled or not.
     */
    _localRecordingEnabled: boolean,

    /**
     * Whether we won't notify the other participants about the recording.
     */
    _localRecordingNoNotification: boolean,

    /**
     * Whether self local recording is enabled or not.
     */
    _localRecordingSelfEnabled: boolean,

    /**
     * The color-schemed stylesheet of this component.
     */
    _styles: StyleType,

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
     * Whether or not we should only record the local streams.
     */
    localRecordingOnlySelf: boolean,

    /**
     * The function will be called when there are changes related to the
     * switches.
     */
    onChange: Function,

    /**
     * Callback to change the local recording only self setting.
     */
    onLocalRecordingSelfChange: Function,

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
 * React Component for getting confirmation to start a file recording session.
 *
 * @augments Component
 */
class StartRecordingDialogContent extends Component<Props> {
    _localRecordingAvailable: boolean;

    /**
     * Initializes a new {@code StartRecordingDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._localRecordingAvailable = props._localRecordingEnabled && supportsLocalRecording();

        // Bind event handler so it is only bound once for every instance.
        this._onSignIn = this._onSignIn.bind(this);
        this._onSignOut = this._onSignOut.bind(this);
        this._onDropboxSwitchChange = this._onDropboxSwitchChange.bind(this);
        this._onRecordingServiceSwitchChange = this._onRecordingServiceSwitchChange.bind(this);
        this._onLocalRecordingSwitchChange = this._onLocalRecordingSwitchChange.bind(this);
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (!this._shouldRenderNoIntegrationsContent()
            && !this._shouldRenderIntegrationsContent()
            && !this._shouldRenderFileSharingContent()) {
            this._onLocalRecordingSwitchChange();
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        // Auto sign-out when the use chooses another recording service.
        if (prevProps.selectedRecordingService === RECORDING_TYPES.DROPBOX
                && this.props.selectedRecordingService !== RECORDING_TYPES.DROPBOX && this.props.isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        const { _styles: styles } = this.props;

        return (
            <Container
                className = 'recording-dialog'
                style = { styles.container }>
                { this._renderNoIntegrationsContent() }
                { this._renderFileSharingContent() }
                { this._renderUploadToTheCloudInfo() }
                { this._renderIntegrationsContent() }
                { this._renderLocalRecordingContent() }
            </Container>
        );
    }

    /**
     * Whether the file sharing content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderFileSharingContent() {
        const {
            fileRecordingsServiceEnabled,
            fileRecordingsServiceSharingEnabled,
            isVpaas,
            selectedRecordingService
        } = this.props;

        if (!fileRecordingsServiceEnabled
            || !fileRecordingsServiceSharingEnabled
            || isVpaas
            || selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        }

        return true;
    }

    /**
     * Renders the file recording service sharing options, if enabled.
     *
     * @returns {React$Component}
     */
    _renderFileSharingContent() {
        if (!this._shouldRenderFileSharingContent()) {
            return null;
        }

        const {
            _dialogStyles,
            _styles: styles,
            isValidating,
            onSharingSettingChanged,
            sharingSetting,
            t
        } = this.props;

        return (
            <Container
                className = 'recording-header'
                key = 'fileSharingSetting'
                style = { styles.header }>
                <Container className = 'recording-icon-container file-sharing-icon-container'>
                    <Image
                        className = 'recording-file-sharing-icon'
                        src = { ICON_USERS }
                        style = { styles.recordingIcon } />
                </Container>
                <Text
                    className = 'recording-title'
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t('recording.fileSharingdescription') }
                </Text>
                <Switch
                    className = 'recording-switch'
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
     * Renders the info in case recording is uploaded to the cloud.
     *
     * @returns {React$Component}
     */
    _renderUploadToTheCloudInfo() {
        const {
            _dialogStyles,
            _hideStorageWarning,
            _styles: styles,
            isVpaas,
            selectedRecordingService,
            t
        } = this.props;

        if (!(isVpaas && selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) || _hideStorageWarning) {
            return null;
        }

        return (
            <Container
                className = 'recording-info'
                key = 'cloudUploadInfo'
                style = { styles.headerInfo }>
                <Image
                    className = 'recording-info-icon'
                    src = { ICON_INFO }
                    style = { styles.recordingInfoIcon } />
                <Text
                    className = 'recording-info-title'
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.titleInfo
                    }}>
                    { t('recording.serviceDescriptionCloudInfo') }
                </Text>
            </Container>
        );
    }

    /**
     * Whether the no integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderNoIntegrationsContent() {
        // show the non integrations part only if fileRecordingsServiceEnabled
        // is enabled
        if (!this.props.fileRecordingsServiceEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Renders the content in case no integrations were enabled.
     *
     * @returns {React$Component}
     */
    _renderNoIntegrationsContent() {
        if (!this._shouldRenderNoIntegrationsContent()) {
            return null;
        }

        const { _dialogStyles, _styles: styles, isValidating, isVpaas, t } = this.props;

        const switchContent
            = this.props.integrationsEnabled || this.props._localRecordingEnabled
                ? (
                    <Switch
                        className = 'recording-switch'
                        disabled = { isValidating }
                        onValueChange = { this._onRecordingServiceSwitchChange }
                        style = { styles.switch }
                        trackColor = {{ false: TRACK_COLOR }}
                        value = { this.props.selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE } />
                ) : null;

        const label = isVpaas ? t('recording.serviceDescriptionCloud') : t('recording.serviceDescription');
        const jitsiContentRecordingIconContainer
            = this.props.integrationsEnabled || this.props._localRecordingEnabled
                ? 'jitsi-content-recording-icon-container-with-switch'
                : 'jitsi-content-recording-icon-container-without-switch';
        const contentRecordingClass = isVpaas
            ? 'cloud-content-recording-icon-container'
            : jitsiContentRecordingIconContainer;
        const jitsiRecordingHeaderClass = !isVpaas && 'jitsi-recording-header';

        return (
            <Container
                className = { `recording-header ${jitsiRecordingHeaderClass}` }
                key = 'noIntegrationSetting'
                style = { styles.header }>
                <Container className = { contentRecordingClass }>
                    <Image
                        className = 'content-recording-icon'
                        src = { ICON_CLOUD }
                        style = { styles.recordingIcon } />
                </Container>
                <Text
                    className = 'recording-title'
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
     * Whether the integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderIntegrationsContent() {
        if (!this.props.integrationsEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Renders the content in case integrations were enabled.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderIntegrationsContent() {
        if (!this._shouldRenderIntegrationsContent()) {
            return null;
        }

        const { _dialogStyles, _styles: styles, isTokenValid, isValidating, t } = this.props;

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
                        label = { t('recording.signOut') }
                        onClick = { this._onSignOut }
                        onPress = { this._onSignOut }
                        type = { BUTTON_TYPES.SECONDARY } />
                </Container>
            );

        } else {
            switchContent = (
                <Container className = 'recording-switch'>
                    <Button
                        label = { t('recording.signIn') }
                        onClick = { this._onSignIn }
                        onPress = { this._onSignIn }
                        type = { BUTTON_TYPES.PRIMARY } />
                </Container>
            );
        }

        if (this.props.fileRecordingsServiceEnabled || this._localRecordingAvailable) {
            switchContent = (
                <Switch
                    className = 'recording-switch'
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
                    className = { `recording-header ${this._shouldRenderNoIntegrationsContent()
                        ? 'recording-header-line' : ''}` }
                    style = { styles.headerIntegrations }>
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

    _onDropboxSwitchChange: () => void;
    _onRecordingServiceSwitchChange: () => void;
    _onLocalRecordingSwitchChange: () => void;

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onRecordingServiceSwitchChange() {
        const {
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return;
        }

        onChange(RECORDING_TYPES.JITSI_REC_SERVICE);
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
        if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return;
        }

        onChange(RECORDING_TYPES.DROPBOX);

        if (!isTokenValid) {
            this._onSignIn();
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onLocalRecordingSwitchChange() {
        const {
            onChange,
            selectedRecordingService
        } = this.props;

        if (!this._localRecordingAvailable) {
            return;
        }

        // act like group, cannot toggle off
        if (selectedRecordingService
            === RECORDING_TYPES.LOCAL) {
            return;
        }

        onChange(RECORDING_TYPES.LOCAL);
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
        const { _styles: styles, spaceLeft, t, userName } = this.props;
        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <Container>
                <Container
                    className = 'logged-in-panel'
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

    _renderLocalRecordingContent: () => void;

    /**
     * Renders the content for local recordings.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderLocalRecordingContent() {
        const {
            _styles: styles,
            isValidating,
            t,
            _dialogStyles,
            selectedRecordingService,
            _localRecordingNoNotification
        } = this.props;

        if (!this._localRecordingAvailable) {
            return null;
        }

        return (
            <>
                <Container>
                    <Container
                        className = 'recording-header recording-header-line'
                        style = { styles.header }>
                        <Container
                            className = 'recording-icon-container'>
                            <Image
                                className = 'recording-icon'
                                src = { LOCAL_RECORDING }
                                style = { styles.recordingIcon } />
                        </Container>
                        <Text
                            className = 'recording-title'
                            style = {{
                                ..._dialogStyles.text,
                                ...styles.title
                            }}>
                            { t('recording.saveLocalRecording') }
                        </Text>
                        <Switch
                            className = 'recording-switch'
                            disabled = { isValidating }
                            onValueChange = { this._onLocalRecordingSwitchChange }
                            style = { styles.switch }
                            trackColor = {{ false: TRACK_COLOR }}
                            value = { this.props.selectedRecordingService
                            === RECORDING_TYPES.LOCAL } />
                    </Container>
                </Container>
                {selectedRecordingService === RECORDING_TYPES.LOCAL && (
                    <>
                        {this.props._localRecordingSelfEnabled && (
                            <Container>
                                <Container
                                    className = 'recording-header space-top'
                                    style = { styles.header }>
                                    <Container className = 'recording-icon-container file-sharing-icon-container'>
                                        <Image
                                            className = 'recording-file-sharing-icon'
                                            src = { ICON_USERS }
                                            style = { styles.recordingIcon } />
                                    </Container>
                                    <Text
                                        className = 'recording-title'
                                        style = {{
                                            ..._dialogStyles.text,
                                            ...styles.title
                                        }}>
                                        {t('recording.onlyRecordSelf')}
                                    </Text>
                                    <Switch
                                        className = 'recording-switch'
                                        disabled = { isValidating }
                                        onValueChange = { this.props.onLocalRecordingSelfChange }
                                        style = { styles.switch }
                                        trackColor = {{ false: TRACK_COLOR }}
                                        value = { this.props.localRecordingOnlySelf } />
                                </Container>
                            </Container>
                        )}
                        <Text className = 'local-recording-warning text'>
                            {t('recording.localRecordingWarning')}
                        </Text>
                        {_localRecordingNoNotification && !this.props.localRecordingOnlySelf
                            && <Text className = 'local-recording-warning notification'>
                                {t('recording.localRecordingNoNotificationWarning')}
                            </Text>
                        }
                    </>
                )}
            </>

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
        _hideStorageWarning: state['features/base/config'].recordingService?.hideStorageWarning,
        _localRecordingEnabled: !state['features/base/config'].localRecording?.disable,
        _localRecordingSelfEnabled: !state['features/base/config'].localRecording?.disableSelfRecording,
        _localRecordingNoNotification: !state['features/base/config'].localRecording?.notifyAllParticipants,
        _styles: ColorSchemeRegistry.get(state, 'StartRecordingDialogContent')
    };
}

export default translate(connect(_mapStateToProps)(StartRecordingDialogContent));
