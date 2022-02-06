// @flow

import React from 'react';
import {
    Alert,
    NativeModules,
    Platform,
    ScrollView,
    Text
} from 'react-native';
import { Divider, Switch, TextInput, withTheme } from 'react-native-paper';

import { translate } from '../../../../../base/i18n';
import JitsiScreen from '../../../../../base/modal/components/JitsiScreen';
import { connect } from '../../../../../base/redux';
import { renderArrowBackButton }
    from '../../../../../mobile/navigation/components/welcome/functions';
import { screen } from '../../../../../mobile/navigation/routes';
import {
    AbstractSettingsView,
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../../../../../settings/components/AbstractSettingsView';
import { normalizeUserInputURL, isServerURLChangeEnabled } from '../../../../../settings/functions';

import FormRow from './FormRow';
import FormSectionAccordion from './FormSectionAccordion';
import styles, { THUMB_COLOR } from './styles';

/**
 * Application information module.
 */
const { AppInfo } = NativeModules;

type State = {

    /**
     * State variable for the disable call integration switch.
     */
    disableCallIntegration: boolean,

    /**
     * State variable for the disable p2p switch.
     */
    disableP2P: boolean,

    /**
     * State variable for the disable crash reporting switch.
     */
    disableCrashReporting: boolean,

    /**
     * State variable for the display name field.
     */
    displayName: string,

    /**
     * State variable for the email field.
     */
    email: string,

    /**
     * State variable for the server URL field.
     */
    serverURL: string,

    /**
     * State variable for the start with audio muted switch.
     */
    startWithAudioMuted: boolean,

    /**
     * State variable for the start with video muted switch.
     */
    startWithVideoMuted: boolean
}

/**
 * The type of the React {@code Component} props of
 * {@link SettingsView}.
 */
type Props = AbstractProps & {

    /**
     * Flag indicating if URL can be changed by user.
     *
     * @protected
     */
    _serverURLChangeEnabled: boolean,

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object,

    /**
     * Theme used for styles.
     */
    theme: Object
}

/**
 * The native container rendering the app settings page.
 *
 * @augments AbstractSettingsView
 */
class SettingsView extends AbstractSettingsView<Props, State> {
    _urlField: Object;

    /**
     * Initializes a new {@code SettingsView} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);
        const {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            displayName,
            email,
            serverURL,
            startWithAudioMuted,
            startWithVideoMuted
        } = props._settings || {};

        this.state = {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            displayName,
            email,
            serverURL,
            startWithAudioMuted,
            startWithVideoMuted
        };

        // Bind event handlers so they are only bound once per instance.
        this._onBlurServerURL = this._onBlurServerURL.bind(this);
        this._onClose = this._onClose.bind(this);
        this._onDisableCallIntegration = this._onDisableCallIntegration.bind(this);
        this._onDisableCrashReporting = this._onDisableCrashReporting.bind(this);
        this._onDisableP2P = this._onDisableP2P.bind(this);
        this._setURLFieldReference = this._setURLFieldReference.bind(this);
        this._showURLAlert = this._showURLAlert.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const {
            navigation
        } = this.props;

        navigation.setOptions({
            headerLeft: () =>
                renderArrowBackButton(() =>
                    navigation.jumpTo(screen.welcome.main))
        });
    }

    /**
     * Implements React's {@link Component#render()}, renders the settings page.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            displayName,
            email,
            serverURL,
            startWithAudioMuted,
            startWithVideoMuted
        } = this.state;
        const { palette } = this.props.theme;

        return (
            <JitsiScreen
                style = { styles.settingsViewContainer }>
                <ScrollView>
                    <FormSectionAccordion
                        accordion = { false }
                        expandable = { false }
                        label = 'settingsView.profileSection'>
                        <TextInput
                            autoCorrect = { false }
                            label = { this.props.t('settingsView.displayName') }
                            mode = 'outlined'
                            onChangeText = { this._onChangeDisplayName }
                            placeholder = 'John Doe'
                            spellCheck = { false }
                            style = { styles.textInputContainer }
                            textContentType = { 'name' } // iOS only
                            theme = {{
                                colors: {
                                    primary: palette.screen01Header,
                                    underlineColor: 'transparent'
                                }
                            }}
                            value = { displayName } />
                        <Divider style = { styles.fieldSeparator } />
                        <TextInput
                            autoCapitalize = 'none'
                            autoCorrect = { false }
                            keyboardType = { 'email-address' }
                            label = { this.props.t('settingsView.email') }
                            mode = 'outlined'
                            onChangeText = { this._onChangeEmail }
                            placeholder = 'email@example.com'
                            spellCheck = { false }
                            style = { styles.textInputContainer }
                            textContentType = { 'emailAddress' } // iOS only
                            theme = {{
                                colors: {
                                    primary: palette.screen01Header,
                                    underlineColor: 'transparent'
                                }
                            }}
                            value = { email } />
                    </FormSectionAccordion>
                    <FormSectionAccordion
                        accordion = { false }
                        expandable = { false }
                        label = 'settingsView.conferenceSection'>
                        <TextInput
                            autoCapitalize = 'none'
                            autoCorrect = { false }
                            editable = { this.props._serverURLChangeEnabled }
                            keyboardType = { 'url' }
                            label = { this.props.t('settingsView.serverURL') }
                            mode = 'outlined'
                            onBlur = { this._onBlurServerURL }
                            onChangeText = { this._onChangeServerURL }
                            placeholder = { this.props._serverURL }
                            spellCheck = { false }
                            style = { styles.textInputContainer }
                            textContentType = { 'URL' } // iOS only
                            theme = {{
                                colors: {
                                    primary: palette.screen01Header,
                                    underlineColor: 'transparent'
                                }
                            }}
                            value = { serverURL } />
                        <Divider style = { styles.fieldSeparator } />
                        <FormRow
                            label = 'settingsView.startWithAudioMuted'>
                            <Switch
                                onValueChange = { this._onStartAudioMutedChange }
                                thumbColor = { THUMB_COLOR }
                                trackColor = {{ true: palette.screen01Header }}
                                value = { startWithAudioMuted } />
                        </FormRow>
                        <Divider style = { styles.fieldSeparator } />
                        <FormRow label = 'settingsView.startWithVideoMuted'>
                            <Switch
                                onValueChange = { this._onStartVideoMutedChange }
                                thumbColor = { THUMB_COLOR }
                                trackColor = {{ true: palette.screen01Header }}
                                value = { startWithVideoMuted } />
                        </FormRow>
                    </FormSectionAccordion>
                    <FormSectionAccordion
                        accordion = { false }
                        expandable = { false }
                        label = 'settingsView.buildInfoSection'>
                        <FormRow
                            label = 'settingsView.version'>
                            <Text>
                                {`${AppInfo.version} build ${AppInfo.buildNumber}`}
                            </Text>
                        </FormRow>
                    </FormSectionAccordion>
                    <FormSectionAccordion
                        accordion = { true }
                        expandable = { true }
                        label = 'settingsView.advanced'>
                        { Platform.OS === 'android' && (
                            <>
                                <FormRow
                                    label = 'settingsView.disableCallIntegration'>
                                    <Switch
                                        onValueChange = { this._onDisableCallIntegration }
                                        thumbColor = { THUMB_COLOR }
                                        trackColor = {{ true: palette.screen01Header }}
                                        value = { disableCallIntegration } />
                                </FormRow>
                                <Divider style = { styles.fieldSeparator } />
                            </>
                        )}
                        <FormRow
                            label = 'settingsView.disableP2P'>
                            <Switch
                                onValueChange = { this._onDisableP2P }
                                thumbColor = { THUMB_COLOR }
                                trackColor = {{ true: palette.screen01Header }}
                                value = { disableP2P } />
                        </FormRow>
                        <Divider style = { styles.fieldSeparator } />
                        {AppInfo.GOOGLE_SERVICES_ENABLED && (
                            <FormRow
                                fieldSeparator = { true }
                                label = 'settingsView.disableCrashReporting'>
                                <Switch
                                    onValueChange = { this._onDisableCrashReporting }
                                    thumbColor = { THUMB_COLOR }
                                    trackColor = {{ true: palette.screen01Header }}
                                    value = { disableCrashReporting } />
                            </FormRow>
                        )}
                    </FormSectionAccordion>
                </ScrollView>
            </JitsiScreen>
        );
    }

    _onBlurServerURL: () => void;

    /**
     * Handler the server URL lose focus event. Here we validate the server URL
     * and update it to the normalized version, or show an error if incorrect.
     *
     * @private
     * @returns {void}
     */
    _onBlurServerURL() {
        this._processServerURL(false /* hideOnSuccess */);
    }

    /**
     * Callback to update the display name.
     *
     * @param {string} displayName - The new value to set.
     * @returns {void}
     */
    _onChangeDisplayName(displayName) {
        super._onChangeDisplayName(displayName);
        this.setState({
            displayName
        });
    }

    /**
     * Callback to update the email.
     *
     * @param {string} email - The new value to set.
     * @returns {void}
     */
    _onChangeEmail(email) {
        super._onChangeEmail(email);
        this.setState({
            email
        });
    }

    /**
     * Callback to update the server URL.
     *
     * @param {string} serverURL - The new value to set.
     * @returns {void}
     */
    _onChangeServerURL(serverURL) {
        super._onChangeServerURL(serverURL);
        this.setState({
            serverURL
        });
    }

    _onDisableCallIntegration: (boolean) => void;

    /**
     * Handles the disable call integration change event.
     *
     * @param {boolean} disableCallIntegration - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableCallIntegration(disableCallIntegration) {
        this._updateSettings({
            disableCallIntegration
        });
        this.setState({
            disableCallIntegration
        });
    }

    _onDisableP2P: (boolean) => void;

    /**
     * Handles the disable P2P change event.
     *
     * @param {boolean} disableP2P - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableP2P(disableP2P) {
        this._updateSettings({
            disableP2P
        });
        this.setState({
            disableP2P
        });
    }

    _onDisableCrashReporting: (boolean) => void;

    /**
     * Handles the disable crash reporting change event.
     *
     * @param {boolean} disableCrashReporting - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableCrashReporting(disableCrashReporting) {
        if (disableCrashReporting) {
            this._showCrashReportingDisableAlert();
        } else {
            this._disableCrashReporting(disableCrashReporting);
        }
    }

    _onClose: () => void;

    /**
     * Callback to be invoked on closing the modal. Also invokes normalizeUserInputURL to validate
     * the URL entered by the user.
     *
     * @returns {boolean} - True if the modal can be closed.
     */
    _onClose() {
        return this._processServerURL(true /* hideOnSuccess */);
    }

    /**
     * Callback to update the start with audio muted value.
     *
     * @param {boolean} startWithAudioMuted - The new value to set.
     * @returns {void}
     */
    _onStartAudioMutedChange(startWithAudioMuted) {
        super._onStartAudioMutedChange(startWithAudioMuted);
        this.setState({
            startWithAudioMuted
        });
    }

    /**
     * Callback to update the start with video muted value.
     *
     * @param {boolean} startWithVideoMuted - The new value to set.
     * @returns {void}
     */
    _onStartVideoMutedChange(startWithVideoMuted) {
        super._onStartVideoMutedChange(startWithVideoMuted);
        this.setState({
            startWithVideoMuted
        });
    }

    /**
     * Processes the server URL. It normalizes it and an error alert is
     * displayed in case it's incorrect.
     *
     * @param {boolean} hideOnSuccess - True if the dialog should be hidden if
     * normalization / validation succeeds, false otherwise.
     * @private
     * @returns {void}
     */
    _processServerURL(hideOnSuccess: boolean) {
        const { serverURL } = this.props._settings;
        const normalizedURL = normalizeUserInputURL(serverURL);

        if (normalizedURL === null) {
            this._showURLAlert();

            return false;
        }

        this._onChangeServerURL(normalizedURL);

        return hideOnSuccess;
    }

    _setURLFieldReference: (React$ElementRef<*> | null) => void;

    /**
     *  Stores a reference to the URL field for later use.
     *
     * @param {Object} component - The field component.
     * @protected
     * @returns {void}
     */
    _setURLFieldReference(component) {
        this._urlField = component;
    }

    _showURLAlert: () => void;

    /**
     * Shows an alert telling the user that the URL he/she entered was invalid.
     *
     * @returns {void}
     */
    _showURLAlert() {
        const { t } = this.props;

        Alert.alert(
            t('settingsView.alertTitle'),
            t('settingsView.alertURLText'),
            [
                {
                    onPress: () => this._urlField.focus(),
                    text: t('settingsView.alertOk')
                }
            ]
        );
    }

    /**
     * Shows an alert warning the user about disabling crash reporting.
     *
     * @returns {void}
     */
    _showCrashReportingDisableAlert() {
        const { t } = this.props;

        Alert.alert(
            t('settingsView.alertTitle'),
            t('settingsView.disableCrashReportingWarning'),
            [
                {
                    onPress: () => this._disableCrashReporting(true),
                    text: t('settingsView.alertOk')
                },
                {
                    text: t('settingsView.alertCancel')
                }
            ]
        );
    }

    _updateSettings: (Object) => void;

    /**
     * Updates the settings and sets state for disableCrashReporting.
     *
     * @param {boolean} disableCrashReporting - Whether crash reporting is disabled or not.
     * @returns {void}
     */
    _disableCrashReporting(disableCrashReporting) {
        this._updateSettings({ disableCrashReporting });
        this.setState({ disableCrashReporting });
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _serverURLChangeEnabled: isServerURLChangeEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(withTheme(SettingsView)));
