// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import {
    IconShareAudio,
    IconStopAudioShare
} from '../../base/icons';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox/components';
import { setDenoiseState } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

}

/**
 * Component that renders a toolbar button for toggling audio only screen share.
 */
class DenoiseAudioButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareaudio';
    icon = IconShareAudio;
    label = 'toolbar.shareaudio';
    tooltip = 'toolbar.shareaudio';
    toggledIcon = IconStopAudioShare;
    toggledLabel = 'toolbar.denoiseAudio';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(setDenoiseState(true));
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
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {

    return {
        _isAudioOnlySharing: true
    };
}

export default translate(connect(_mapStateToProps)(DenoiseAudioButton));
