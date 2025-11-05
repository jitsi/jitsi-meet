import { createRemoteVideoMenuButtonEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { rejectParticipantAudio } from '../../av-moderation/actions';
import { IconMicSlash } from '../../base/icons/svg';
import { MEDIA_TYPE } from '../../base/media/constants';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isRemoteTrackMuted } from '../../base/tracks/functions.any';
import { muteRemote } from '../actions.any';

export interface IProps extends AbstractButtonProps {

    /**
     * Boolean to indicate if the audio track of the participant is muted or
     * not.
     */
    _audioTrackMuted: boolean;

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

        dispatch(muteRemote(participantID, MEDIA_TYPE.AUDIO));
        dispatch(rejectParticipantAudio(participantID));
    }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    override _isDisabled() {
        return this.props._audioTrackMuted;
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    override _isToggled() {
        return this.props._audioTrackMuted;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const tracks = state['features/base/tracks'];

    return {
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID)
    };
}
