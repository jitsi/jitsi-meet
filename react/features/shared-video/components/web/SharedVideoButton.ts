import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconPlay } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { toggleSharedVideo } from '../../actions';
import { isSharingStatus } from '../../functions';

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
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedVideoButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.stopSharedVideo';
    override icon = IconPlay;
    override label = 'toolbar.sharedvideo';
    override toggledLabel = 'toolbar.stopSharedVideo';
    override tooltip = 'toolbar.sharedvideo';
    override toggledTooltip = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
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
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { ownerId, status: sharedVideoStatus } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const isSharing = isSharingStatus(sharedVideoStatus ?? '');

    return {
        _isDisabled: isSharing && ownerId !== localParticipantId,
        _sharingVideo: isSharing
    };
}

export default translate(connect(_mapStateToProps)(SharedVideoButton));
