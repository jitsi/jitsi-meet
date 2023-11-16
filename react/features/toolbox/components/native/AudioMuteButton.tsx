import { connect } from 'react-redux';

import { AUDIO_MUTED_CHANGED } from '../../../base/conference/actionTypes';
import { translate } from '../../../base/i18n/functions';
import AbstractAudioMuteButton, { IProps, mapStateToProps } from '../AbstractAudioMuteButton';

/**
 * Component that renders native toolbar button for toggling audio mute.
 *
 * @augments AbstractAudioMuteButton
 */
class AudioMuteButton extends AbstractAudioMuteButton<IProps> {
    /**
     * Changes audio muted state and dispatches the state to redux.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch?.({
            type: AUDIO_MUTED_CHANGED,
            muted: audioMuted
        });

        super._setAudioMuted(audioMuted);
    }
}

export default translate(connect(mapStateToProps)(AudioMuteButton));
