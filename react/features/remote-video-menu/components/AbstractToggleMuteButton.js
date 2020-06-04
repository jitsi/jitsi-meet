// @flow

import { IconMicDisabled, IconMicrophone } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox';
import { isRemoteTrackMuted } from '../../base/tracks';

import {muteRemote, unMuteRemote} from "../actions";

export type Props = AbstractButtonProps & {

    /**
     * Boolean to indicate if the audio track of the participant is muted or
     * not.
     */
    _audioTrackMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractToggleMuteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.remoteMute';
    icon = IconMicrophone;
    toggledIcon = IconMicDisabled;
    label = 'videothumbnail.domute';
    toggledLabel = 'videothumbnail.doUnMute';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID, _audioTrackMuted } = this.props;

        if(_audioTrackMuted) {
            dispatch(unMuteRemote(participantID));
        } else {
            dispatch(muteRemote(participantID));
        }
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    _isToggled() {
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
export function _mapStateToProps(state: Object, ownProps: Props) {
    const tracks = state['features/base/tracks'];

    return {
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID)
    };
}
