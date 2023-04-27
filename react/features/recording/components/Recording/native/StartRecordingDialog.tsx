import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import HeaderNavigationButton
    from '../../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack } from
    '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { RECORDING_TYPES } from '../../../constants';
import AbstractStartRecordingDialog, {
    IProps,
    mapStateToProps
} from '../AbstractStartRecordingDialog';
import styles from '../styles.native';

import StartRecordingDialogContent from './StartRecordingDialogContent';


/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @augments Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog {

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
        super.componentDidMount();

        const { navigation, t } = this.props;

        navigation.setOptions({
            headerRight: () => (
                <HeaderNavigationButton
                    disabled = { this.isStartRecordingDisabled() }
                    label = { t('dialog.start') }
                    onPress = { this._onStartPress }
                    twoActions = { true } />
            )
        });
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}. Invoked
     * immediately after this component is updated.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        super.componentDidUpdate(prevProps);

        const { navigation, t } = this.props;

        navigation.setOptions({
            // eslint-disable-next-line react/no-multi-comp
            headerRight: () => (
                <HeaderNavigationButton
                    disabled = { this.isStartRecordingDisabled() }
                    label = { t('dialog.start') }
                    onPress = { this._onStartPress }
                    twoActions = { true } />
            )
        });
    }

    /**
     * Starts recording session and goes back to the previous screen.
     *
     * @returns {void}
     */
    _onStartPress() {
        this._onSubmit() && goBack();
    }

    /**
     * Disables start recording button.
     *
     * @returns {boolean}
     */
    isStartRecordingDisabled() {
        const { isTokenValid, selectedRecordingService } = this.state;

        // Start button is disabled if recording service is only shown;
        // When validating dropbox token, if that is not enabled, we either always
        // show the start button or, if just dropbox is enabled, start button
        // is available when there is token.
        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        } else if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return !isTokenValid;
        }

        return true;

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
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
