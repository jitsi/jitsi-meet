// @flow

import { translate } from '../../../base/i18n';
import {
    IconMuteEveryone,
    IconRoomLock,
    IconRoomUnlock
} from '../../../base/icons';
import {
    getAllModeratorParticipantsId,
    getLocalParticipant,
    PARTICIPANT_ROLE
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';
import { muteAllParticipants } from "../../../remote-video-menu/actions";
import {setToggleLockUnMute} from "../../../base/conference";

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string,

    /**
     * Moderators id
     */
    moderators: Array<string>
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant (except the local one)
 */
class LockUnMuteGuestsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.lockUnMuteGuests';
    icon = IconRoomLock;
    toggledIcon = IconRoomUnlock
    label = 'toolbar.lockUnMuteGuests';
    toggledLabel = 'toolbar.unLockUnMuteGuest';
    tooltip = 'toolbar.ockUnMuteGuests';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {

        const { dispatch, conference, unMuteLocked } = this.props;

        dispatch(
            setToggleLockUnMute(
                conference,
                conference.lockUnMute,
                !unMuteLocked
            )
        )
    }

    _isToggled(): boolean {
        return this.props.unMuteLocked
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Props} ownProps - The component's own props.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const { conference, unMuteLocked } = state['features/base/conference'];
    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const { visible } = ownProps;
    const { disableRemoteMute } = state['features/base/config'];

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: visible && isModerator && !disableRemoteMute,
        conference,
        unMuteLocked
    };
}

export default translate(connect(_mapStateToProps)(LockUnMuteGuestsButton));
