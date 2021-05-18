// @flow

import type { Dispatch } from 'redux';


import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n';
import {
    IconShareAudio,
    IconStopAudioShare
} from '../../base/icons';
import { browser } from '../../base/lib-jitsi-meet';
import { connect } from '../../base/redux';
import { shouldHideShareAudioHelper } from '../../base/settings';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox/components';
import { toggleScreensharing } from '../../base/tracks';
import { ShareAudioDialog } from '../components';
import { isAudioOnlySharing, isScreenVideoShared, isScreenAudioSupported } from '../functions';


type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * TODO
     */
    _isDisabled: boolean,

    /**
     * TODO
     */
    _isAudioOnlySharing: boolean,

    /**
     * TODO
     */
    _isScreenVideoShared: boolean,

    /**
     * TODO
     */
     _shouldHideShareAudioHelper: boolean
}

/**
 * TODO
 */
class ShareAudioButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareaudio';
    icon = IconShareAudio;
    label = 'toolbar.shareaudio';
    tooltip = 'toolbar.shareaudio';
    toggledIcon = IconStopAudioShare;
    toggledLabel = 'toolbar.stopAudioSharing';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedAudioDialog();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isAudioOnlySharing;
    }

    /**
     * Dispatches an action to toggle video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedAudioDialog() {


        const enable = !this.props._isAudioOnlySharing;

        if (this.props._isScreenVideoShared) {
            alert('NO GO!');

            return;
        }

        // if is toggled or is saved in cache or we're in electron go directly to functionality
        if (this.props._shouldHideShareAudioHelper || browser.isElectron() || this._isToggled()) {
            // First parameter is ignored is only for the mobile flow, and this feature is only
            // available on web, so it doesn't have any effect but we add it for consistency.
            this.props.dispatch(toggleScreensharing(enable, true));

            return;
        }

        this.props.dispatch(openDialog(ShareAudioDialog));
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

    return {
        _isDisabled: isScreenAudioSupported(),
        _isAudioOnlySharing: isAudioOnlySharing(state),
        _isScreenVideoShared: isScreenVideoShared(state),
        _shouldHideShareAudioHelper: shouldHideShareAudioHelper(state)
    };
}

export default translate(connect(_mapStateToProps)(ShareAudioButton));
