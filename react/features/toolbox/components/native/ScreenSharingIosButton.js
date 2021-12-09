// @flow

import React from 'react';
import { findNodeHandle, NativeModules, Platform } from 'react-native';
import { ScreenCapturePickerView } from 'react-native-webrtc';

import { getFeatureFlag, IOS_SCREENSHARING_ENABLED } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconShareDesktop } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isLocalVideoTrackDesktop } from '../../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ScreenSharingIosButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the button needs to be disabled.
     */
    _disabled: boolean,

    /**
     * Whether video is currently muted or not.
     */
    _screensharing: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

const styles = {
    screenCapturePickerView: {
        display: 'none'
    }
};

/**
 * An implementation of a button for toggling screen sharing on iOS.
 */
class ScreenSharingIosButton extends AbstractButton<Props, *> {
    _nativeComponent: ?Object;
    _setNativeComponent: Function;

    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    icon = IconShareDesktop;
    label = 'toolbar.startScreenSharing';
    toggledLabel = 'toolbar.stopScreenSharing';

    /**
   * Initializes a new {@code ScreenSharingIosButton} instance.
   *
   * @param {Object} props - The React {@code Component} props to initialize
   * the new {@code ScreenSharingIosButton} instance with.
   */
    constructor(props) {
        super(props);

        this._nativeComponent = null;

        // Bind event handlers so they are only bound once per instance.
        this._setNativeComponent = this._setNativeComponent.bind(this);
    }

    /**
    * Sets the internal reference to the React Component wrapping the
    * {@code RPSystemBroadcastPickerView} component.
    *
    * @param {ReactComponent} component - React Component.
    * @returns {void}
    */
    _setNativeComponent(component) {
        this._nativeComponent = component;
    }

    /**
   * Handles clicking / pressing the button.
   *
   * @override
   * @protected
   * @returns {void}
   */
    _handleClick() {
        const handle = findNodeHandle(this._nativeComponent);

        NativeModules.ScreenCapturePickerViewManager.show(handle);
    }

    /**
   * Returns a boolean value indicating if this button is disabled or not.
   *
   * @protected
   * @returns {boolean}
   */
    _isDisabled() {
        return this.props._disabled;
    }

    /**
   * Indicates whether this button is in toggled state or not.
   *
   * @override
   * @protected
   * @returns {boolean}
   */
    _isToggled() {
        return this.props._screensharing;
    }

    /**
   * Helper function to be implemented by subclasses, which may return a
   * new React Element to be appended at the end of the button.
   *
   * @protected
   * @returns {ReactElement|null}
   */
    _getElementAfter() {
        return (
            <ScreenCapturePickerView
                ref = { this._setNativeComponent }
                style = { styles.screenCapturePickerView } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ScreenSharingIosButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _disabled: boolean,
 * }}
 */
function _mapStateToProps(state): Object {
    const enabled = getFeatureFlag(state, IOS_SCREENSHARING_ENABLED, false);

    return {
        _screensharing: isLocalVideoTrackDesktop(state),

        // TODO: this should work on iOS 12 too, but our trick to show the picker doesn't work.
        visible: enabled && Platform.OS === 'ios' && Platform.Version.split('.')[0] >= 14
    };
}

export default translate(connect(_mapStateToProps)(ScreenSharingIosButton));
