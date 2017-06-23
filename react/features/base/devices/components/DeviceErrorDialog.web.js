import React, { Component } from 'react';

import { MessageDialog } from '../../dialog';
import { translate } from '../../i18n';
import { JitsiTrackErrors } from '../../lib-jitsi-meet';

/**
 * Implements a device error message dialog.
 */
class DeviceErrorDialog extends Component {
    /**
     * {@code DeviceErrorDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * This camera error to be displayed.
         */
        cameraError: React.PropTypes.object,

        /**
         * The microphone error to be displayed.
         */
        micError: React.PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { cameraError, micError, t } = this.props;
        const cameraMessage
            = _getErrorMessage(cameraError, _getCameraErrorMessageKey, t);
        const micMessage
            = _getErrorMessage(micError, _getMicErrorMessageKey, t);

        let title = 'dialog.error';

        if (micError && micError.name === JitsiTrackErrors.PERMISSION_DENIED) {
            if (!cameraError
                || cameraError.name === JitsiTrackErrors.PERMISSION_DENIED) {
                title = 'dialog.permissionDenied';
            }
        } else if (cameraError
            && cameraError.name === JitsiTrackErrors.PERMISSION_DENIED) {
            title = 'dialog.permissionDenied';
        }

        return (
            <MessageDialog
                cancelDisabled = { true }
                titleKey = { title }
                width = 'medium'
                { ...this.props }>
                {micMessage}
                {cameraMessage}
            </MessageDialog>
        );
    }
}

/**
 * Constructs the error message to be shown, based on the error name and
 * error message, uses translations if available.
 *
 * @param {Object} error - The error.
 * @param {Function} getErrorMessageKey - The function to obtain
 * translation key.
 * @param {Function} t - Invoked to obtain translated strings.
 * @returns {ReactElement}
 * @private
 */
function _getErrorMessage(error, getErrorMessageKey, t) {
    const jitsiTrackErrorMsg
        = error ? getErrorMessageKey(error.name) : undefined;
    const errorMsg
        = error ? jitsiTrackErrorMsg
                    || getErrorMessageKey(JitsiTrackErrors.GENERAL)
                : '';
    const additionalErrorMsg
        = !jitsiTrackErrorMsg && error && error.message
            ? <div>${error.message}</div> : '';

    let message;

    /* eslint-disable react/jsx-wrap-multilines */
    if (error) {
        message
            = <div>
                <h3>{ t('dialog.micErrorPresent') }</h3>
                <h4>{ t(errorMsg) }</h4>
                {additionalErrorMsg}
            </div>;
    }
    /* eslint-enable react/jsx-wrap-multilines */

    return message;
}

/**
 * Returns the i18n key for known camera errors.
 *
 * @param {string} name - The name of the error.
 * @returns {string|null} - Returns the appropriate i18n key.
 * @private
 */
function _getCameraErrorMessageKey(name) {
    switch (name) {
    case JitsiTrackErrors.UNSUPPORTED_RESOLUTION:
        return 'dialog.cameraUnsupportedResolutionError';
    case JitsiTrackErrors.GENERAL:
        return 'dialog.cameraUnknownError';
    case JitsiTrackErrors.PERMISSION_DENIED:
        return 'dialog.cameraPermissionDeniedError';
    case JitsiTrackErrors.NOT_FOUND:
        return 'dialog.cameraNotFoundError';
    case JitsiTrackErrors.CONSTRAINT_FAILED:
        return 'dialog.cameraConstraintFailedError';
    case JitsiTrackErrors.NO_DATA_FROM_SOURCE:
        return 'dialog.cameraNotSendingData';
    default:
        return null;
    }
}

/**
 * Returns the i18n key for known microphone errors.
 *
 * @param {string} name - The name of the error.
 * @returns {string|null} - Returns the appropriate i18n key.
 * @private
 */
function _getMicErrorMessageKey(name) {
    switch (name) {
    case JitsiTrackErrors.GENERAL:
        return 'dialog.micUnknownError';
    case JitsiTrackErrors.PERMISSION_DENIED:
        return 'dialog.micPermissionDeniedError';
    case JitsiTrackErrors.NOT_FOUND:
        return 'dialog.micNotFoundError';
    case JitsiTrackErrors.CONSTRAINT_FAILED:
        return 'dialog.micConstraintFailedError';
    case JitsiTrackErrors.NO_DATA_FROM_SOURCE:
        return 'dialog.micNotSendingData';
    default:
        return null;
    }
}

export default translate(DeviceErrorDialog);
