import { createRemoteVideoMenuButtonEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { IconVideoOff } from '../../base/icons/svg';
import { MEDIA_TYPE } from '../../base/media/constants';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isRemoteTrackMuted } from '../../base/tracks/functions.any';

import { MuteRemoteParticipantsVideoDialog } from './';

export interface IProps extends AbstractButtonProps {

    /**
     * Boolean to indicate if the video track of the participant is muted or
     * not.
     */
    _videoTrackMuted: boolean;

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractMuteVideoButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.remoteVideoMute';
    icon = IconVideoOff;
    label = 'videothumbnail.domuteVideo';
    toggledLabel = 'videothumbnail.videoMuted';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'video.mute.button',
            {
                'participant_id': participantID
            }));

        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, { participantID }));
    }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    _isDisabled() {
        return this.props._videoTrackMuted;
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    _isToggled() {
        return this.props._videoTrackMuted;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _videoTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const tracks = state['features/base/tracks'];

    return {
        _videoTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.VIDEO, ownProps.participantID)
    };
}
