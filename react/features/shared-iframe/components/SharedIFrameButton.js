// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { IconShareIFrame } from '../../base/icons';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox/components';
import { toggleSharedIFrame } from '../actions.any';

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
     * Whether or not the local participant is sharing an iframe.
     */
    _sharingIFrame: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The Key of the sharedIFrame Config for this button.
     */
    shareKey: String
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedIFrameButton extends AbstractButton<Props, *> {
    accessibilityLabel = this.props.t('toolbar.accessibilityLabel.sharediframe', {
        iframename: this.props.shareKey
    });
    icon = IconShareIFrame;
    label = this.props.t('toolbar.sharediframe', {
        iframename: this.props.shareKey
    });
    toggledLabel = this.props.t('toolbar.stopSharedIFrame', {
        iframename: this.props.shareKey
    });

    /**
     * Dynamically retrieves tooltip based on sharing state.
     */
    get tooltip() {
        if (this._isDisabled()) {
            return this.props.t('toolbar.disabledSharedIFrame', {
                iframename: this.props.shareKey
            });
        }
        if (this._isToggled()) {
            return this.props.t('toolbar.stopSharedIFrame', {
                iframename: this.props.shareKey
            });
        }

        return this.props.t('toolbar.sharediframe', {
            iframename: this.props.shareKey
        });
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The icon value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedIFrame();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._sharingIFrame;
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
     * Dispatches an action to toggle iframe sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedIFrame() {
        this.props.dispatch(toggleSharedIFrame(this.props.shareKey));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The Props.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const sharedIFrames = state['features/shared-iframe'].iframes || {};

    return {
        _isDisabled: sharedIFrames[ownProps.shareKey]?.disabled || false,
        _sharingIFrame: sharedIFrames[ownProps.shareKey]?.isSharing || false,
    };
}


export default translate(connect(_mapStateToProps)(SharedIFrameButton));
