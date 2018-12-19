// @flow

import { connect } from 'react-redux';

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { MEDIA_TYPE } from '../../../base/media';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';

import MuteRemoteParticipantDialog from './MuteRemoteParticipantDialog';

type Props = AbstractButtonProps & {

    /**
     * The audio track of the participant.
     */
    _audioTrack: ?Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The participant object that this button is supposed to mute/unmute.
     */
    participant: Object
};

/**
 * A remote video menu button which mutes the remote participant.
 */
class MuteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.audioRoute';
    iconName = 'icon-mic-disabled';
    label = 'videothumbnail.domute';
    toggledLabel = 'videothumbnail.muted';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participant } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'mute.button',
            {
                'participant_id': participant.id
            }));

        dispatch(openDialog(MuteRemoteParticipantDialog, { participant }));
    }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    _isDisabled() {
        return this._isMuted();
    }

    /**
     * Returns true if the participant is muted, false otherwise.
     *
     * @returns {boolean}
     */
    _isMuted() {
        const { _audioTrack } = this.props;

        return !_audioTrack || _audioTrack.muted;
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    _isToggled() {
        return this._isMuted();
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrack: Track
 *  }}
 */
function _mapStateToProps(state, ownProps) {
    const tracks = state['features/base/tracks'];
    const audioTrack
        = getTrackByMediaTypeAndParticipant(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participant.id);

    return {
        _audioTrack: audioTrack
    };
}

export default translate(connect(_mapStateToProps)(MuteButton));
