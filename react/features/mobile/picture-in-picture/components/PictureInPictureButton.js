// @flow

import { connect } from 'react-redux';

import { getAppProp } from '../../../app';
import { translate } from '../../../base/i18n';
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
    accessibilityLabel = 'Picture in picture';
    iconName = 'icon-menu-down';
    label = 'toolbar.pip';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(enterPictureInPicture());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {?ReactElement}
     */
    render() {
        if (!this.props._enabled) {

            // $FlowFixMe
            return null;
        }

        return super.render();
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
    return {
        _enabled: Boolean(getAppProp(state, 'pictureInPictureEnabled'))
    };
}

export default translate(connect(_mapStateToProps)(PictureInPictureButton));
