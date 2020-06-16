// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { IconShareVideo } from '../../base/icons';
import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { toggleSharedVideo } from '../actions';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Whether or not the local participant is sharing a YouTube video.
     */
    _sharingVideo: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @extends AbstractButton
 */
class VideoShareButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    icon = IconShareVideo;
    label = 'toolbar.sharedvideo';
    toggledLabel = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedVideo();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._sharingVideo;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._isDisabled;
    }

    /**
     * Dispatches an action to toggle YouTube video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedVideo() {
        this.props.dispatch(toggleSharedVideo());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const { ownerId, status: sharedVideoStatus } = state['features/youtube-player'];
    const localParticipantId = getLocalParticipant(state).id;

    if (ownerId !== localParticipantId) {
        return {
            _isDisabled: isSharingStatus(sharedVideoStatus),
            _sharingVideo: false };
    }

    return {
        _sharingVideo: isSharingStatus(sharedVideoStatus)
    };
}

/**
 * Checks if the status is one that is actually sharing the video - playing, pause or start.
 *
 * @param {string} status - The shared video status.
 * @private
 * @returns {boolean}
 */
function isSharingStatus(status) {
    return [ 'playing', 'pause', 'start' ].includes(status);
}

export default translate(connect(_mapStateToProps)(VideoShareButton));
