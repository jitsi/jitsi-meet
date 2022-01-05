// @flow

import { approveParticipant } from '../../../av-moderation/actions';
import { isSupported } from '../../../av-moderation/functions';
import { translate } from '../../../base/i18n';
import { IconCamera, IconMicrophone } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { getParticipantById, isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isForceMuted } from '../../../participants-pane/functions';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Whether or not the participant is audio force muted.
     */
    isAudioForceMuted: boolean,

    /**
     * Whether or not the participant is video force muted.
     */
    isVideoForceMuted: boolean,

    /**
     * The ID of the participant object that this button is supposed to
     * ask to unmute.
     */
    participantID: string
};

/**
 * An abstract remote video menu button which asks the remote participant to unmute.
 */
class AskUnmuteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'participantsPane.actions.askUnmute';
    icon = IconMicrophone;
    label = 'participantsPane.actions.askUnmute';

    /**
     * Gets the current label.
     *
     * @returns {string}
     */
    _getLabel() {
        const { isAudioForceMuted, isVideoForceMuted } = this.props;

        if (!isAudioForceMuted && isVideoForceMuted) {
            return 'participantsPane.actions.allowVideo';
        }

        return this.label;
    }

    /**
     * Gets the current icon.
     *
     * @returns {string}
     */
    _getIcon() {
        const { isAudioForceMuted, isVideoForceMuted } = this.props;

        if (!isAudioForceMuted && isVideoForceMuted) {
            return IconCamera;
        }

        return this.icon;
    }

    /**
     * Handles clicking / pressing the button, and asks the participant to unmute.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(approveParticipant(participantID));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {Props}
 */
function mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;
    const participant = getParticipantById(state, participantID);

    return {
        isAudioForceMuted: isForceMuted(participant, MEDIA_TYPE.AUDIO, state),
        isVideoForceMuted: isForceMuted(participant, MEDIA_TYPE.VIDEO, state),
        visible: isLocalParticipantModerator(state) && isSupported()
    };
}

export default translate(connect(mapStateToProps)(AskUnmuteButton));
