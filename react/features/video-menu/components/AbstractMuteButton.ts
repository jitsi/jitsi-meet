import { createRemoteVideoMenuButtonEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { MEDIA_TYPE as AVM_MEDIA_TYPE } from '../../av-moderation/constants';
import { canRejectParticipant } from '../../av-moderation/functions';
import { IconMicSlash } from '../../base/icons/svg';
import { MEDIA_TYPE } from '../../base/media/constants';
import { getParticipantById } from '../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isRemoteTrackMuted } from '../../base/tracks/functions.any';
import { muteRemoteAndReject } from '../actions.any';

export interface IProps extends AbstractButtonProps {

    /**
     * Boolean to indicate if the audio track of the participant is muted or
     * not.
     */
    _audioTrackMuted: boolean;

    /**
     * Boolean to indicate if the participant can be removed from the A/V moderation whitelist.
     */
    _canReject: boolean;

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractMuteButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.remoteMute';
    override icon = IconMicSlash;
    override label = 'videothumbnail.domute';
    override toggledLabel = 'videothumbnail.muted';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'mute',
            {
                'participant_id': participantID
            }));

        dispatch(muteRemoteAndReject(participantID, MEDIA_TYPE.AUDIO));
    }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    override _isDisabled() {
        return this._isMuted();
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    override _isToggled() {
        return this._isMuted();
    }

    /**
     * Tells if the participant must be shown as muted. A participant that can be removed from the A/V moderation
     * whitelist is not shown as muted, because the mute state that the participant reports can be incorrect. The
     * moderator must be able to mute the participant on the bridge.
     *
     * @private
     * @returns {boolean}
     */
    _isMuted() {
        return this.props._audioTrackMuted && !this.props._canReject;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean,
 *      _canReject: boolean
 *  }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const tracks = state['features/base/tracks'];
    const participant = getParticipantById(state, ownProps.participantID);

    return {
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID),
        _canReject: canRejectParticipant(participant, AVM_MEDIA_TYPE.AUDIO, state)
    };
}
