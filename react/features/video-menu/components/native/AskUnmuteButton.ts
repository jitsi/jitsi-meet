import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { approveParticipant } from '../../../av-moderation/actions';
import { isSupported } from '../../../av-moderation/functions';
import { translate } from '../../../base/i18n/functions';
import { IconMic, IconVideo } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getParticipantById, isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isForceMuted } from '../../../participants-pane/functions';

export interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the participant is audio force muted.
     */
    isAudioForceMuted: boolean;

    /**
     * Whether or not the participant is video force muted.
     */
    isVideoForceMuted: boolean;

    /**
     * The ID of the participant object that this button is supposed to
     * ask to unmute.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which asks the remote participant to unmute.
 */
class AskUnmuteButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'participantsPane.actions.askUnmute';
    override icon = IconMic;
    override label = 'participantsPane.actions.askUnmute';

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
            return IconVideo;
        }

        return this.icon;
    }

    /**
     * Handles clicking / pressing the button, and asks the participant to unmute.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(approveParticipant(participantID));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID } = ownProps;
    const participant = getParticipantById(state, participantID);

    return {
        isAudioForceMuted: isForceMuted(participant, MEDIA_TYPE.AUDIO, state),
        isVideoForceMuted: isForceMuted(participant, MEDIA_TYPE.VIDEO, state),
        visible: isLocalParticipantModerator(state) && isSupported()(state)
    };
}

export default translate(connect(mapStateToProps)(AskUnmuteButton));
