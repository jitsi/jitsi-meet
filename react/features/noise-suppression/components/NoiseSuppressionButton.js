// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import {
    IconShareAudio,
    IconStopAudioShare
} from '../../base/icons';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox/components';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { toggleNoiseSuppression } from '../actions';
import { isNoiseSuppressionActive } from '../functions';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

}

/**
 * Component that renders a toolbar button for toggling noise suppression.
 */
class NoiseSuppressionButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.noiseSuppression';
    icon = IconShareAudio;
    label = 'toolbar.noiseSuppression';
    tooltip = 'toolbar.noiseSuppression';
    toggledIcon = IconStopAudioShare;
    toggledLabel = 'toolbar.disableNoiseSuppression';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleNoiseSuppression());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isNoiseSuppressionActive;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {

    return {
        _isNoiseSuppressionActive: isNoiseSuppressionActive(state)
    };
}

export default translate(connect(_mapStateToProps)(NoiseSuppressionButton));
