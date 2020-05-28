// @flow

import { translate } from '../../../base/i18n';
import { IconMuteEveryone } from '../../../base/icons';
import {
    getAllModeratorParticipantsId,
    getLocalParticipant,
    PARTICIPANT_ROLE
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';
import { unMuteAllParticipants } from "../../../remote-video-menu/actions";

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
 * Implements a React {@link Component} which displays a button for audio un muting
 * every participant (except the local one)
 */
class UnMuteEveryoneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.unMuteEveryone';
    icon = IconMuteEveryone;
    label = 'toolbar.unMuteEveryone';
    tooltip = 'toolbar.unMuteEveryone';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, moderators } = this.props;

        dispatch(unMuteAllParticipants(moderators));
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
    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const { visible } = ownProps;
    const { disableRemoteUnMute } = state['features/base/config'];
    const moderators = getAllModeratorParticipantsId(state);

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        moderators,
        visible: visible && isModerator && !disableRemoteUnMute
    };
}

export default translate(connect(_mapStateToProps)(UnMuteEveryoneButton));
