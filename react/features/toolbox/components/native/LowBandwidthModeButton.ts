import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { setLowBandwidthMode, toggleLowBandwidthMode } from '../../../base/low-bandwidth-mode/actions';
import { LOW_BANDWIDTH_MODE_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconLowBandwidthMode, IconLowBandwidthModeOff } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import {
    navigate
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

/**
 * The type of the React {@code Component} props of {@link LowBandwidthModeButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _lowBandwidthMode: boolean;

    /**
     * Indicates whether the car mode is enabled.
     */
    _startCarMode?: boolean;
}

/**
 * An implementation of a button for toggling the audio-only mode.
 */
class LowBandwidthModeButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.lowBandwidthMode';
    override icon = IconLowBandwidthMode;
    override label = 'toolbar.lowBandwidthModeOn';
    override toggledIcon = IconLowBandwidthModeOff;
    override toggledLabel = 'toolbar.lowBandwidthModeOff';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _lowBandwidthMode, _startCarMode, dispatch } = this.props;

        if (!_lowBandwidthMode && _startCarMode) {
            dispatch(setLowBandwidthMode(true));
            navigate(screen.conference.carmode);
        } else {
            dispatch(toggleLowBandwidthMode());
        }
    }


    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._lowBandwidthMode;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code LowBandwidthModeButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {{
 *     _lowBandwidthMode: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { enabled: audioOnly } = state['features/base/low-bandwidth-mode'];
    const enabledInFeatureFlags = getFeatureFlag(state, LOW_BANDWIDTH_MODE_BUTTON_ENABLED, true);
    const { startCarMode } = state['features/base/settings'];
    const { visible = enabledInFeatureFlags } = ownProps;

    return {
        _lowBandwidthMode: Boolean(audioOnly),
        _startCarMode: startCarMode,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LowBandwidthModeButton));
