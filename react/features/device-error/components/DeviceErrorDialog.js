import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { setDeviceErrorDialogPreference } from '../actions';

// FIXME The global reference to JitsiMeetJS is being used because at this
// module's loading the imported JitsiMeetJS returns undefined.
declare var JitsiMeetJS: Object;

const TrackErrors = JitsiMeetJS.errors.track;
const ERROR_MESSAGE_MAP = {
    camera: {
        [TrackErrors.CONSTRAINT_FAILED]: 'dialog.cameraConstraintFailedError',
        [TrackErrors.GENERAL]: 'dialog.cameraUnknownError',
        [TrackErrors.NO_DATA_FROM_SOURCE]: 'dialog.cameraNotSendingData',
        [TrackErrors.NOT_FOUND]: 'dialog.cameraNotFoundError',
        [TrackErrors.PERMISSION_DENIED]: 'dialog.cameraPermissionDeniedError',
        [TrackErrors.UNSUPPORTED_RESOLUTION]:
            'dialog.cameraUnsupportedResolutionError'
    },
    microphone: {
        [TrackErrors.CONSTRAINT_FAILED]: 'dialog.micConstraintFailedError',
        [TrackErrors.GENERAL]: 'dialog.micUnknownError',
        [TrackErrors.NO_DATA_FROM_SOURCE]: 'dialog.micNotSendingData',
        [TrackErrors.NOT_FOUND]: 'dialog.micNotFoundError',
        [TrackErrors.PERMISSION_DENIED]: 'dialog.micPermissionDeniedError'
    }
};
const { PERMISSION_DENIED } = TrackErrors;

/**
 * React {@code Component} for displaying an error dialog about a failed attempt
 * to use a media device. On close, dispatches an action to save the preference
 * for never displaying the dialog again for the given error types.
 *
 * @extends Component
 */
class DeviceErrorDialog extends Component {
    /**
     * {@code DeviceErrorDialog}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiTrackError returned from failing to use a camera.
         *
         * @type {JitsiTrackError}
         */
        cameraError: React.PropTypes.object,

        /**
         * Invoked to update the preference of whether or not the dialog should
         * display again.
         */
        dispatch: React.PropTypes.func,

        /**
         * The key used to save whether or not the dialog for the given errors
         * should display again.
         */
        localStorageKey: React.PropTypes.string,

        /**
         * The JitsiTrackError returned from failing to use a microphone.
         *
         * @type {JitsiTrackError}
         */
        micError: React.PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new {@code DeviceErrorDialog} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * An internal reference for whether or not the checkbox for never
             * showing the error dialog again is checked. This preference is
             * used to determine if future errors of the same types will display
             * a dialog or not. On submission of this dialog, the preference
             * will be saved into local storage.
             *
             * @private
             * @type {boolean}
             */
            checked: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onCheckboxChange = this._onCheckboxChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                isModal = { true }
                onSubmit = { this._onSubmit }
                titleKey = { this._createTitle() }
                width = 'small' >
                <div>
                    { this._renderMicErrorMessage() }
                    { this._renderCameraErrorMessage() }
                    { this._renderDoNoShowMessage() }
                </div>
            </Dialog>
        );
    }

    /**
     * Returns which translation key should be used as the overlay's title based
     * on the types of errors present.
     *
     * @private
     * @returns {string}
     */
    _createTitle() {
        const { cameraError, micError } = this.props;

        let title = 'dialog.error';

        if (micError && micError.name === PERMISSION_DENIED) {
            if (!cameraError || cameraError.name === PERMISSION_DENIED) {
                title = 'dialog.permissionDenied';
            }
        } else if (cameraError && cameraError.name === PERMISSION_DENIED) {
            title = 'dialog.permissionDenied';
        }

        return title;
    }

    /**
     * Updates the internal state with the current checked state of the "do not
     * show" checkbox.
     *
     * @param {Event} event - The event from the checkbox changing its checked
     * state.
     * @private
     * @returns {void}
     */
    _onCheckboxChange(event) {
        this.setState({ checked: event.target.checked });
    }

    /**
     * Dispatches an action to persistswhether or not, based on the "checked"
     * state, future errors of the same types should display a dialog.
     *
     * @private
     * @returns {boolean} True is returned to close the dialog.
     */
    _onSubmit() {
        this.props.dispatch(setDeviceErrorDialogPreference(
            this.props.localStorageKey,
            this.state.checked));

        return true;
    }

    /**
     * Creates a ReactElement to display the passed in camera error. Will match
     * the camera error type to a pre-existing error message or will use the
     * message provided by the error itself if no match is found.
     *
     * @private
     * @returns {ReactElement|null} Returns null if no camera error is present.
     */
    _renderCameraErrorMessage() {
        const { cameraError } = this.props;

        if (!cameraError) {
            return null;
        }

        const jitsiCameraErrorMessage
            = ERROR_MESSAGE_MAP.camera[cameraError.name];
        const errorMessage = jitsiCameraErrorMessage
                || ERROR_MESSAGE_MAP.camera[TrackErrors.GENERAL];
        const additionalInfo = !jitsiCameraErrorMessage && cameraError.message;

        return (
            <div>
                <h3>{ this.props.t('dialog.cameraErrorPresent') }</h3>
                <h4>{ this.props.t(errorMessage) }</h4>
                { additionalInfo }
            </div>
        );
    }

    /**
     * Creates a ReactElement to display a checkbox for setting whether or not
     * a dialog of the same passed in error types should ever display again.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderDoNoShowMessage() {
        if (!this._shouldRenderDoNotShowMessage()) {
            return null;
        }

        return (
            <div className = 'device-error-do-not-show'>
                <input
                    checked = { this.state.checked }
                    id = 'doNotShowWarningAgain'
                    onChange = { this._onCheckboxChange }
                    type = 'checkbox' />
                <span>
                    { this.props.t('dialog.doNotShowWarningAgain') }
                </span>
            </div>
        );
    }

    /**
     * Creates a ReactElement to display the passed in mic error. Will match the
     * mic error type to a pre-existing error message or will use the message
     * provided by the error itself if no match is found.
     *
     * @private
     * @returns {ReactElement|null} Returns null if no mic error is present.
     */
    _renderMicErrorMessage() {
        const { micError } = this.props;

        if (!micError) {
            return null;
        }

        const jitsiMicErrorMessage
            = ERROR_MESSAGE_MAP.microphone[micError.name];
        const errorMessage = jitsiMicErrorMessage
                || ERROR_MESSAGE_MAP.microphone[TrackErrors.GENERAL];
        const additionalInfo = !jitsiMicErrorMessage && micError.message;

        return (
            <div>
                <h3>{ this.props.t('dialog.micErrorPresent') }</h3>
                <h4>{ this.props.t(errorMessage) }</h4>
                { additionalInfo }
            </div>
        );
    }

    /**
     * Checks whether or not the ReactElement for setting a "do not show"
     * preference should be rendered. True is returned if both camera and mic
     * errors are JitsiTrackErrors or if only one JitsiTrackError is present.
     *
     * @private
     * @returns {boolean}
     */
    _shouldRenderDoNotShowMessage() {
        const { cameraError, micError } = this.props;
        const isCameraJitsiTrackErrorWithName = cameraError
            && cameraError.name
            && cameraError instanceof JitsiMeetJS.errorTypes.JitsiTrackError;
        const isMicJitsiTrackErrorWithName = micError
            && micError.name
            && micError instanceof JitsiMeetJS.errorTypes.JitsiTrackError;

        return (isMicJitsiTrackErrorWithName && isCameraJitsiTrackErrorWithName)
            || (isMicJitsiTrackErrorWithName && !cameraError)
            || (isCameraJitsiTrackErrorWithName && !micError);

    }
}

export default translate(connect()(DeviceErrorDialog));
