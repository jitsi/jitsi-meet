// @flow

import { translate } from '../../../../base/i18n';
import { IconLiveStreaming } from '../../../../base/icons';
import { connect } from '../../../../base/redux';

import AbstractLiveStreamButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractLiveStreamButton';

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
    _liveStreamDisabledTooltipKey: ?string
}

/**
 * An implementation of a button for starting and stopping live streaming.
 */
class LiveStreamButton extends AbstractLiveStreamButton<Props> {
    icon = IconLiveStreaming;

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.props._liveStreamDisabledTooltipKey || '';
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
 * {@code LiveStreamButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isLiveStreamRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    let { visible } = ownProps;

    const _disabledByFeatures = abstractProps.disabledByFeatures;
    let _disabled = false;
    let _liveStreamDisabledTooltipKey;

    if (!abstractProps.visible
            && _disabledByFeatures !== undefined && !_disabledByFeatures) {
        _disabled = true;

        // button and tooltip
        if (state['features/base/jwt'].isGuest) {
            _liveStreamDisabledTooltipKey
                = 'dialog.liveStreamingDisabledForGuestTooltip';
        } else {
            _liveStreamDisabledTooltipKey
                = 'dialog.liveStreamingDisabledTooltip';
        }
    }

    if (typeof visible === 'undefined') {
        visible = interfaceConfig.TOOLBAR_BUTTONS.includes('livestreaming')
            && (abstractProps.visible
                    || Boolean(_liveStreamDisabledTooltipKey));
    }

    return {
        ...abstractProps,
        _disabled,
        _liveStreamDisabledTooltipKey,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));
