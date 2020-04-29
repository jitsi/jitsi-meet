// @flow

import { Platform } from 'react-native';

import { PIP_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconMenuDown } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import { enterPictureInPicture } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * Whether Picture-in-Picture is enabled or not.
     */
    _enabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for entering Picture-in-Picture mode.
 */
class PictureInPictureButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    icon = IconMenuDown;
    label = 'toolbar.pip';

    /**
     * Handles clicking / pressing the button.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(enterPictureInPicture());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        return this.props._enabled ? super.render() : null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code PictureInPictureButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _enabled: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const flag = Boolean(getFeatureFlag(state, PIP_ENABLED));
    let enabled = flag;

    // Override flag for Android < 26, PiP was introduced in Oreo.
    // https://developer.android.com/guide/topics/ui/picture-in-picture
    if (Platform.OS === 'android' && Platform.Version < 26) {
        enabled = false;
    }

    return {
        _enabled: enabled
    };
}

export default translate(connect(_mapStateToProps)(PictureInPictureButton));
