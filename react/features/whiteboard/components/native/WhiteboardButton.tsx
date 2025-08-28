import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconWhiteboard } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setWhiteboardOpen } from '../../actions.any';
import { isWhiteboardButtonVisible } from '../../functions';

/**
 * Component that renders a toolbar button for the whiteboard.
 */
class WhiteboardButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.showWhiteboard';
    override icon = IconWhiteboard;
    override label = 'toolbar.showWhiteboard';
    override tooltip = 'toolbar.showWhiteboard';

    /**
     * Handles clicking / pressing the button, and opens the whiteboard view.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        this.props.dispatch(setWhiteboardOpen(true));
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
        visible: isWhiteboardButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
