// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { IconShareVideo } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox/components';
import { showSharedVideoDialog } from '../../actions.web';
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
    _doToggleSharedVideoDialog() {
        const { dispatch } = this.props;

        return this._isToggled()
            ? APP.UI.stopSharedVideoEmitter()
            : dispatch(showSharedVideoDialog(id => APP.UI.startSharedVideoEmitter(id)));
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
    const {
        disabled: sharedVideoBtnDisabled,
        status: sharedVideoStatus
    } = state['features/shared-video'];

    return {
        _isDisabled: sharedVideoBtnDisabled,
        _sharingVideo: isSharingStatus(sharedVideoStatus)
    };
}


export default translate(connect(_mapStateToProps)(SharedVideoButton));
