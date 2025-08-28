import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconWhiteboard, IconWhiteboardHide } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { setWhiteboardOpen } from '../../actions.any';
import { isWhiteboardButtonVisible, isWhiteboardVisible } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the button is toggled.
     */
    _toggled: boolean;
}

/**
 * Component that renders a toolbar button for the whiteboard.
 */
class WhiteboardButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.showWhiteboard';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.hideWhiteboard';
    override icon = IconWhiteboard;
    override label = 'toolbar.showWhiteboard';
    override toggledIcon = IconWhiteboardHide;
    override toggledLabel = 'toolbar.hideWhiteboard';
    override toggledTooltip = 'toolbar.hideWhiteboard';
    override tooltip = 'toolbar.showWhiteboard';

    /**
     * Handles clicking / pressing the button, and opens / closes the whiteboard view.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _toggled } = this.props;

        dispatch(setWhiteboardOpen(!_toggled));
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
        return this.props._toggled;
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
        _toggled: isWhiteboardVisible(state),
        visible: isWhiteboardButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
