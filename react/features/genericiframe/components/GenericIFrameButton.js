// @flow

import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconShareDoc } from '../../base/icons';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps,
} from '../../base/toolbox/components';
import { toggleVisibility } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * Whether the genericIFrame is visible or not.
     */
    _visible: boolean,

    /**
     * Redux dispatch function.
     */
    dispatch: Dispatch<any>,
};

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class GenericIFrameButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.genericIFrame';
    icon = IconShareDoc;
    label = 'toolbar.genericIFrameOpen';
    toggledLabel = 'toolbar.genericIFrameClose';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(
            createToolbarEvent('toggle.genericIFrame', {
                enable: !this.props._visible
            })
        );
        this.props.dispatch(toggleVisibility());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._visible;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    const { iframeUrl, visible } = state['features/genericiframe'];
    const { active = Boolean(iframeUrl) } = ownProps;

    return {
        // Toggles the text of the button
        _visible: visible,

        // Hides the Button if no URL was provided.
        visible: active
    };
}

export default translate(connect(_mapStateToProps)(GenericIFrameButton));
