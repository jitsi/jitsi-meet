// @flow

import { MEETING_PASSWORD_ENABLED, getFeatureFlag } from '../../base/flags';
import { translate } from '../../base/i18n';
import { IconRoomLock, IconRoomUnlock } from '../../base/icons';
import { isLocalParticipantModerator } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import { beginRoomLockRequest, unlockRoom } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * Whether the current local participant is a moderator, therefore is
     * allowed to lock or unlock the conference.
     */
    _localParticipantModerator: boolean,

    /**
     * Whether the current conference is locked or not.
     */
    _locked: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for locking / unlocking a room.
 */
class RoomLockButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.lockRoom';
    icon = IconRoomLock;
    label = 'dialog.lockRoom';
    toggledIcon = IconRoomUnlock;
    toggledLabel = 'dialog.unlockRoom';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _locked } = this.props;

        if (_locked) {
            dispatch(unlockRoom());
        } else {
            dispatch(beginRoomLockRequest());
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._localParticipantModerator;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
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
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { conference, locked } = state['features/base/conference'];
    const enabled = getFeatureFlag(state, MEETING_PASSWORD_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _localParticipantModerator: Boolean(conference && isLocalParticipantModerator(state)),
        _locked: Boolean(conference && locked),
        visible
    };
}

export default translate(connect(_mapStateToProps)(RoomLockButton));
