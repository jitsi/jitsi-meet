import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconRoomBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import AbstractButton, { AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

import { isRoomBackgroundDefined } from './../functions';
import RoomBackgroundDialog from './RoomBackgroundDialog';

/**
 * The type of the React {@code Component} props of {@link RoomBackgroundButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the background of the room is set.
     */
    _isBackgroundRoomEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An abstract implementation of a button that toggles the room background dialog.
 */
class RoomBackgroundButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.selectRoomBackground';
    icon = IconRoomBackground;
    label = 'toolbar.selectRoomBackground';
    tooltip = 'toolbar.selectRoomBackground';

    /**
     * Handles clicking / pressing the button, and toggles the room background dialog
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(openDialog(RoomBackgroundDialog));
    }

    /**
     * Returns {@code boolean} value indicating if the room background effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isBackgroundRoomEnabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RoomBackgroundButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isBackgroundEnabled: boolean
 * }}
 */
function _mapStateToProps(state): Object {

    return {
        _isBackgroundRoomEnabled: isRoomBackgroundDefined(state)
    };
}

export default translate(connect(_mapStateToProps)(RoomBackgroundButton));
