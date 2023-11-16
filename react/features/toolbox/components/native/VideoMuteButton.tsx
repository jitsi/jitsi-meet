import { connect } from 'react-redux';

import { VIDEO_MUTED_CHANGED } from '../../../base/conference/actionTypes';
import { translate } from '../../../base/i18n/functions';
import AbstractVideoMuteButton, { IProps, mapStateToProps } from '../AbstractVideoMuteButton';

/**
 * Component that renders native toolbar button for toggling video mute.
 *
 * @augments AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton<IProps> {
    /**
     * Changes video muted state and dispatches the state to redux.
     *
     * @override
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) {
        this.props.dispatch?.({
            type: VIDEO_MUTED_CHANGED,
            muted: videoMuted
        });

        super._setVideoMuted(videoMuted);
    }
}

export default translate(connect(mapStateToProps)(VideoMuteButton));
