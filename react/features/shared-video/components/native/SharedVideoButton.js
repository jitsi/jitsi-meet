// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, VIDEO_SHARE_BUTTON_ENABLED } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconShareVideo } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { toggleSharedVideo } from '../../actions.native';
import { isSharingStatus } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Whether or not the local participant is sharing a video.
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
 * @augments AbstractButton
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
     * Dispatches an action to toggle video sharing.
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
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { ownerId, status: sharedVideoStatus } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;
    const enabled = getFeatureFlag(state, VIDEO_SHARE_BUTTON_ENABLED, true);
    const { visible = enabled } = ownProps;

    if (ownerId !== localParticipantId) {
        return {
            _isDisabled: isSharingStatus(sharedVideoStatus),
            _sharingVideo: false,
            visible
        };
    }

    return {
        _isDisabled: false,
        _sharingVideo: isSharingStatus(sharedVideoStatus),
        visible
    };
}

export default translate(connect(_mapStateToProps)(VideoShareButton));
