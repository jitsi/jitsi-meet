import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { VIDEO_SHARE_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconPlay } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { toggleSharedVideo } from '../../actions';
import { isSharingStatus } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean;

    /**
     * Whether or not the local participant is sharing a video.
     */
    _sharingVideo: boolean;
}

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @augments AbstractButton
 */
class VideoShareButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    override icon = IconPlay;
    override label = 'toolbar.sharedvideo';
    override toggledLabel = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        this._doToggleSharedVideo();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._sharingVideo;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDisabled() {
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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { ownerId, status: sharedVideoStatus } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const enabled = getFeatureFlag(state, VIDEO_SHARE_BUTTON_ENABLED, true);
    const { visible = enabled } = ownProps;

    if (ownerId !== localParticipantId) {
        return {
            _isDisabled: isSharingStatus(sharedVideoStatus ?? ''),
            _sharingVideo: false,
            visible
        };
    }

    return {
        _isDisabled: false,
        _sharingVideo: isSharingStatus(sharedVideoStatus ?? ''),
        visible
    };
}

export default translate(connect(_mapStateToProps)(VideoShareButton));
