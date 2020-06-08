// @flow

import { translate } from '../../../base/i18n';

import { IconMicDisabled } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import { muteAllParticipants } from '../../../remote-video-menu/actions';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string,

    moderators: Array<string>
};

/**
 * An implementation of a button for showing the {@code OverflowMenu}.
 */
class MuteAllButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Invite';
    icon = IconMicDisabled;
    label = 'Invite';

    /**
     * Handles clicking / pressing this {@code OverflowMenuButton}.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, moderators } = this.props;

        dispatch(muteAllParticipants(moderators));
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;

    const participants = state['features/base/participants'];

    // eslint-disable-next-line max-len
    const moderators = participants.filter(participant => participant.role === PARTICIPANT_ROLE.MODERATOR).map(item => item.id);

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: isModerator,
        moderators
    };
}

export default translate(connect(_mapStateToProps)(MuteAllButton));