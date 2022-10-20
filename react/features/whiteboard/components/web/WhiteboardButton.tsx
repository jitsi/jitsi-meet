/* eslint-disable lines-around-comment */
import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconHideWhiteboard, IconShowWhiteboard } from '../../../base/icons/svg';
import { connect } from '../../../base/redux/functions';
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
// @ts-ignore
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { setWhiteboardOpen } from '../../actions';
import { isWhiteboardVisible } from '../../functions';


type Props = AbstractButtonProps & {

    /**
     * Whether or not the button is toggled.
     */
    _toggled: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
};

/**
 * Component that renders a toolbar button for the whiteboard.
 */
class WhiteboardButton extends AbstractButton<Props, any, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.whiteboard';
    icon = IconShowWhiteboard;
    label = 'toolbar.showWhiteboard';
    toggledIcon = IconHideWhiteboard;
    toggledLabel = 'toolbar.hideWhiteboard';
    toggledTooltip = 'toolbar.hideWhiteboard';
    tooltip = 'toolbar.showWhiteboard';

    /**
     * Handles clicking / pressing the button, and opens / closes the whiteboard view.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {

        // @ts-ignore
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
    _isToggled() {
        // @ts-ignore
        return this.props._toggled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _toggled: isWhiteboardVisible(state)
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(WhiteboardButton));
