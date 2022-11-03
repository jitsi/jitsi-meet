/* eslint-disable lines-around-comment */
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import {
    IconNoiseSuppressionOff,
    IconNoiseSuppressionOn
} from '../../base/icons/svg';
import { connect } from '../../base/redux/functions';
import {
    AbstractButton,
    type AbstractButtonProps
    // @ts-ignore
} from '../../base/toolbox/components';
// @ts-ignore
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { toggleNoiseSuppression } from '../actions';
import { isNoiseSuppressionEnabled } from '../functions';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function;

};

/**
 * Component that renders a toolbar button for toggling noise suppression.
 */
class NoiseSuppressionButton extends AbstractButton<Props, any, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.noiseSuppression';
    icon = IconNoiseSuppressionOn;
    label = 'toolbar.noiseSuppression';
    tooltip = 'toolbar.noiseSuppression';
    toggledIcon = IconNoiseSuppressionOff;
    toggledLabel = 'toolbar.disableNoiseSuppression';

    private props: Props;

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
        return this.props._isNoiseSuppressionEnabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState): Object {
    return {
        _isNoiseSuppressionEnabled: isNoiseSuppressionEnabled(state)
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(NoiseSuppressionButton));
