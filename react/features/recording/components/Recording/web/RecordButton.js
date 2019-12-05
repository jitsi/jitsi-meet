// @flow

import { translate } from '../../../../base/i18n';
import { IconToggleRecording } from '../../../../base/icons';
import { connect } from '../../../../base/redux';

import AbstractRecordButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractRecordButton';

declare var interfaceConfig: Object;

type Props = AbstractProps & {

    /**
     * True if the button should be disabled, false otherwise.
     *
     * NOTE: On web, if the feature is not disabled on purpose, then we still
     * show the button but disabled and with a tooltip rendered on it,
     * explaining why it's not available.
     */
    _disabled: boolean,

    /**
     * Tooltip for the button when it's disabled in a certain way.
     */
    _fileRecordingsDisabledTooltipKey: ?string
}

/**
 * An implementation of a button for starting and stopping recording.
 */
class RecordButton extends AbstractRecordButton<Props> {
    icon = IconToggleRecording;

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.tooltip || '';
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _fileRecordingsDisabledTooltipKey: ?string,
 *     _isRecordingRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    let { visible } = ownProps;

    const _disabledByFeatures = abstractProps.disabledByFeatures;
    let _disabled = false;
    let _fileRecordingsDisabledTooltipKey;

    if (!abstractProps.visible
            && _disabledByFeatures !== undefined && !_disabledByFeatures) {
        _disabled = true;

        // button and tooltip
        if (state['features/base/jwt'].isGuest) {
            _fileRecordingsDisabledTooltipKey
                = 'dialog.recordingDisabledForGuestTooltip';
        } else {
            _fileRecordingsDisabledTooltipKey
                = 'dialog.recordingDisabledTooltip';
        }
    }

    if (typeof visible === 'undefined') {
        visible = interfaceConfig.TOOLBAR_BUTTONS.includes('recording')
            && (abstractProps.visible
                    || Boolean(_fileRecordingsDisabledTooltipKey));
    }

    return {
        ...abstractProps,
        visible,
        _disabled,
        _fileRecordingsDisabledTooltipKey
    };
}

export default translate(connect(_mapStateToProps)(RecordButton));
