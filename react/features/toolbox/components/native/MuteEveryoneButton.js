// @flow

import { translate } from '../../../base/i18n';
import { IconMicDisabled } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';
import { muteAllParticipants } from '../../../remote-video-menu/actions';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant (except the local one)
 */
class MuteEveryoneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryone';
    icon = IconMicDisabled;
    label = 'toolbar.muteEveryone';
    tooltip = 'toolbar.muteEveryone';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, localParticipantId } = this.props;

        dispatch(muteAllParticipants([ localParticipantId ]));
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

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: isModerator
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryoneButton));