import AKInlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToggleStateless } from '@atlaskit/toggle';

import { translate } from '../../base/i18n';
import { isButtonEnabled, ToolbarButton } from '../../toolbox';
import Recording from '../../../../modules/UI/recording/Recording';

const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'recording',
    classNames: [ 'button', 'icon-recEnable' ],
    enabled: true,
    id: 'toolbar_button_record',
    tooltipKey: 'recording.buttonTooltip'
};

/**
 * TOFIX: Copy paste from VideoQualityButton, we need a base class that supports
 * inline dialogs and does that position thing.
 * @type {{bottom: string, left: string, right: string, top: string}}
 */
const TOOLTIP_TO_DIALOG_POSITION = {
    bottom: 'bottom center',
    left: 'left middle',
    right: 'right middle',
    top: 'top center'
};

/**
 * React {@code Component} for displaying an inline dialog for changing receive
 * video settings.
 *
 * @extends Component
 */
class RecordingButton extends Component {
    /**
     * {@code RecordingButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux store representation of the JitsiConference.
         */
        _conference: React.PropTypes.object,

        /**
         * Indicates if the recording button has been toggled.
         */
        _recordingButtonToggled: React.PropTypes.bool,

        /**
         * Indicates if the audio recording option should be enabled.
         */
        _recordingEnabled: React.PropTypes.bool,

        /**
         * Indicates if the transcription option should be enabled.
         */
        _transcriptionEnabled: React.PropTypes.bool,

        /**
         * Whether or not the button is visible, based on the visibility of the
         * toolbar. Used to automatically hide the inline dialog if not visible.
         */
        _visible: React.PropTypes.bool,

        /**
         * Invoked to obtain translated string.
         */
        t: React.PropTypes.func,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: React.PropTypes.string
    };

    /**
     * Initializes a new {@code RecordingButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the inline dialog for adjusting received video
             * quality is displayed.
             */
            showRecordingDialog: false,

            isToggleRecordingChecked: false,

            isToggleTranscriptionChecked: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
        this._onToggleRecordingChange
            = this._onToggleRecordingChange.bind(this);
        this._onToggleTranscriptionChange
            = this._onToggleTranscriptionChange.bind(this);
    }

    /**
     * Updates the toggled state depending on the _recordingButtonToggled
     * prop.
     *
     * @param {Object} nextProps - The props that will be applied after the
     * update.
     * @inheritdoc
     * @returns {void}
     */
    componentWillUpdate(nextProps) {
        if (nextProps._recordingButtonToggled
            !== this.props._recordingButtonToggled
            && nextProps._recordingButtonToggled
            !== this.state.isToggleRecordingChecked) {
            this.setState({
                isToggleRecordingChecked: nextProps._recordingButtonToggled
            });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible, tooltipPosition } = this.props;
        const buttonConfiguration = {
            ...DEFAULT_BUTTON_CONFIGURATION,
            classNames: [
                ...DEFAULT_BUTTON_CONFIGURATION.classNames,
                this.state.showRecordingDialog ? 'toggled button-active' : ''
            ]
        };

        const content = this._renderRecordingMenu();

        return (
            <AKInlineDialog
                content = { content }
                isOpen = { _visible && this.state.showRecordingDialog }
                onClose = { this._onDialogClose }
                position = { TOOLTIP_TO_DIALOG_POSITION[tooltipPosition] }>
                <ToolbarButton
                    button = { buttonConfiguration }
                    onClick = { this._onDialogToggle }
                    tooltipPosition = { tooltipPosition } />
            </AKInlineDialog>
        );
    }

    /**
     * Hides the attached inline dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.setState({ showRecordingDialog: false });
    }

    /**
     * Toggles the display of the dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        this.setState({
            showRecordingDialog: !this.state.showRecordingDialog
        });
    }

    /**
     * Updates the current known state of the toggle selection.
     *
     * @param {Object} event - The DOM event from changing the toggle selection.
     * @private
     * @returns {void}
     */
    _onToggleRecordingChange(event) {
        this.setState({
            isToggleRecordingChecked: event.target.checked
        });
        Recording.toggleRecording();
    }

    /**
     * Updates the current known state of the toggle selection.
     *
     * @param {Object} event - The DOM event from changing the toggle selection.
     * @private
     * @returns {void}
     */
    _onToggleTranscriptionChange(event) {
        const checked = event.target.checked;

        this.setState({
            isToggleTranscriptionChecked: checked
        });

        checked
            ? this.props._conference.startTranscriber()
            : this.props._conference.stopTranscriber();
    }

    /**
     * Creates a new {@code RemoteVideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRecordingMenu() {
        const {
            _recordingEnabled,
            _transcriptionEnabled
        } = this.props;

        const buttons = [];

        if (_recordingEnabled) {
            buttons.push(
                <div key = 'recordingKey'>
                    <ToggleStateless
                        isChecked
                            = { this.state.isToggleRecordingChecked }
                        label = 'Recording'
                        onChange = { this._onToggleRecordingChange } />
                    <span className = 'recording-popup-item'>
                        { this.props.t('recording.videoRecordingLabel') }
                    </span>
                </div>
            );
        }

        if (_transcriptionEnabled) {
            buttons.push(
                <div key = 'transcriptionKey'>
                    <ToggleStateless
                        isChecked
                            = { this.state.isToggleTranscriptionChecked }
                        label = 'Transcription'
                        onChange = { this._onToggleTranscriptionChange } />
                    <span className = 'recording-popup-item'>
                        { this.props.t('recording.transcriptionLabel') }
                    </span>
                </div>
            );
        }

        if (buttons.length > 0) {
            return (
                <div className = 'recording-popup-dialog'>
                    <h4 className = 'recording-popup-title'>
                        { this.props.t('recording.recordingPopupTitle') }
                    </h4>
                    { buttons }
                </div>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoQualityButton}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { conference } = state['features/base/conference'];
    const { enableRecording, enableUserRolesBasedOnToken }
        = state['features/base/config'];
    const { isGuest } = state['features/jwt'];
    const { recordingButtonToggled } = state['features/recording'];

    return {
        _conference: conference,
        _visible: state['features/toolbox'].visible,
        _recordingButtonToggled: recordingButtonToggled,
        _recordingEnabled: isButtonEnabled('recording')
            && enableRecording
            && conference && conference.isRecordingSupported(),
        _transcriptionEnabled: isButtonEnabled('transcription')
            && (!enableUserRolesBasedOnToken || !isGuest)
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
