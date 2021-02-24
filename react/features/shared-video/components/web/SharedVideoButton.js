// @flow

import type { Dispatch } from 'redux';

import {
    createSharedVideoEvent as createEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconShareVideo } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox/components';
import { showSharedVideoDialog } from '../../actions';
import { isSharingStatus } from '../../functions';

declare var APP: Object;

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Meeting participant
     */
    _participant: string,

    /**
     * Whether or not the local participant is sharing a video.
     */
    _sharingVideo: boolean
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedVideoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    icon = IconShareVideo;
    label = 'toolbar.sharedvideo';
    tooltip = 'toolbar.sharedvideo';
    toggledLabel = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedVideoDialog();
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
     * Starts the video.
     *
     * @param {string} videoId - Video link id.
     * @returns {boolean}
     */
    _startSharedVideo(videoId: string) {
        const { _participant } = this.props;

        APP.UI.onSharedVideoStart(
            _participant, videoId,
            {
                state: 'start',
                from: _participant
            });
        sendAnalytics(createEvent('started'));
    }

    /**
     * Removes the video.
     *
     * @returns {boolean}
     */
    _removeSharedVideo() {
        const { _participant } = this.props;

        APP.UI.onSharedVideoStop(
            _participant,
            {
                state: 'stop',
                from: _participant
            });
        sendAnalytics(createEvent('removed'));
    }

    /**
     * Dispatches an action to toggle YouTube video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedVideoDialog() {
        const { dispatch } = this.props;

        this._isToggled()
            ? this._removeSharedVideo()
            : dispatch(showSharedVideoDialog(id => this._startSharedVideo(id)));
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
    const { status: sharedVideoStatus } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    return {
        _participant: localParticipantId || '',
        _sharingVideo: isSharingStatus(sharedVideoStatus)
    };
}


export default translate(connect(_mapStateToProps)(SharedVideoButton));
