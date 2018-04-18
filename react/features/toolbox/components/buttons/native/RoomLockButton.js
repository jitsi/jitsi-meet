// @flow

import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';
import { beginRoomLockRequest } from '../../../../room-lock';

import AbstractButton from '../AbstractButton';
import type { Props as AbstractButtonProps } from '../AbstractButton';

type Props = AbstractButtonProps & {

    /**
     * The current conference.
     */
    _conference: Object,

    /**
     * Whether the current conference is locked or not.
     */
    _locked: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * An implementation of a button for locking / unlocking a room.
 */
class RoomLockButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Room lock';
    iconName = 'security';
    label = 'toolbar.lock';
    toggledIconName = 'security-locked';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(beginRoomLockRequest());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._conference;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._locked;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RoomLockButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { conference, locked } = state['features/base/conference'];

    return {
        _conference: conference,
        _locked: Boolean(conference && locked)
    };
}

export default translate(connect(_mapStateToProps)(RoomLockButton));
