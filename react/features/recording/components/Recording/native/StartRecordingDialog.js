// @flow

import React from 'react';
import { Text, TouchableRipple } from 'react-native-paper';

import { translate } from '../../../../base/i18n';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { connect } from '../../../../base/redux';
import BaseTheme from '../../../../base/ui/components/BaseTheme';
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

        this._onOkPress = this._onOkPress.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const {
            _fileRecordingsServiceEnabled,
            _isDropboxEnabled,
            navigation,
            t
        } = this.props;

        const {
            isTokenValid,
            isValidating
        } = this.state;

        // disable ok button id recording service is shown only, when
        // validating dropbox token, if that is not enabled we either always
        // show the ok button or if just dropbox is enabled ok is available
        // when there is token
        const isOkDisabled
            = _fileRecordingsServiceEnabled ? isValidating
                : _isDropboxEnabled ? !isTokenValid : false;

        navigation.setOptions({
            headerRight: () => (
                <TouchableRipple
                    disabled = { isOkDisabled }
                    onPress = { this._onOkPress }
                    rippleColor = { BaseTheme.palette.screen01Header } >
                    <Text style = { styles.startRecordingLabel }>
                        { t('dialog.start') }
                    </Text>
                </TouchableRipple>
            )
        });
    }

    _onOkPress: () => void;

    /**
     * Starts recording session and goes back to the previous screen.
     *
     * @returns {void}
     */
    _onOkPress() {
        this._onSubmit() && goBack();
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
