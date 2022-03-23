// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { connect } from '../../../../base/redux';
import HeaderNavigationButton
    from '../../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack } from
    '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import AbstractStartRecordingDialog, {
    type Props,
    mapStateToProps
} from '../AbstractStartRecordingDialog';
import StartRecordingDialogContent from '../StartRecordingDialogContent';
import styles from '../styles.native';

/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @augments Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog<Props> {

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onStartPress = this._onStartPress.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { navigation, t } = this.props;

        navigation.setOptions({
            headerRight: () => (
                <HeaderNavigationButton
                    disabled = { this._onDisableStartRecording() }
                    label = { t('dialog.start') }
                    onPress = { this._onStartPress }
                    twoActions = { true } />
            )
        });
    }

    _onStartPress: () => void;

    /**
     * Starts recording session and goes back to the previous screen.
     *
     * @returns {void}
     */
    _onStartPress() {
        this._onSubmit() && goBack();
    }

    _onDisableStartRecording: () => boolean;

    /**
     * Disables start recording button.
     *
     * @returns {boolean}
     */
    _onDisableStartRecording() {
        const { _fileRecordingsServiceEnabled, _isDropboxEnabled } = this.props;
        const { isTokenValid, isValidating } = this.state;

        // disable ok button id recording service is shown only, when
        // validating dropbox token, if that is not enabled we either always
        // show the ok button or if just dropbox is enabled ok is available
        // when there is token
        if (_fileRecordingsServiceEnabled) {
            return isValidating;
        } else if (_isDropboxEnabled) {
            return isTokenValid;
        }

        return false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            isTokenValid,
            isValidating,
            selectedRecordingService,
            sharingEnabled,
            spaceLeft,
            userName
        } = this.state;
        const {
            _fileRecordingsServiceEnabled,
            _fileRecordingsServiceSharingEnabled
        } = this.props;

        return (
            <JitsiScreen style = { styles.startRecodingContainer }>
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                    fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    onChange = { this._onSelectedRecordingServiceChanged }
                    onSharingSettingChanged = { this._onSharingSettingChanged }
                    selectedRecordingService = { selectedRecordingService }
                    sharingSetting = { sharingEnabled }
                    spaceLeft = { spaceLeft }
                    userName = { userName } />
            </JitsiScreen>
        );
    }

    _areIntegrationsEnabled: () => boolean;
    _onSubmit: () => boolean;
    _onSelectedRecordingServiceChanged: (string) => void;
    _onSharingSettingChanged: () => void;
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
