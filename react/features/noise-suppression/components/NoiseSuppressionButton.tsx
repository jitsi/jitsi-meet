import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import {
    IconNoiseSuppressionOff,
    IconNoiseSuppressionOn
} from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { toggleNoiseSuppression } from '../actions';
import { isNoiseSuppressionEnabled } from '../functions';

interface IProps extends AbstractButtonProps {
    _isNoiseSuppressionEnabled?: boolean;
}

/**
 * Component that renders a toolbar button for toggling noise suppression.
 */
class NoiseSuppressionButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.noiseSuppression';
    override icon = IconNoiseSuppressionOn;
    override label = 'toolbar.noiseSuppression';
    override tooltip = 'toolbar.noiseSuppression';
    override toggledIcon = IconNoiseSuppressionOff;
    override toggledLabel = 'toolbar.disableNoiseSuppression';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
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
    override _isToggled() {
        return this.props._isNoiseSuppressionEnabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _isNoiseSuppressionEnabled: isNoiseSuppressionEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(NoiseSuppressionButton));
