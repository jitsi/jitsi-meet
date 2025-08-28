import React from 'react';
import { NativeModules, Platform, findNodeHandle } from 'react-native';
import { ScreenCapturePickerView } from 'react-native-webrtc';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IOS_SCREENSHARING_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconScreenshare } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isLocalVideoTrackDesktop } from '../../../base/tracks/functions.native';

/**
 * The type of the React {@code Component} props of {@link ScreenSharingIosButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * True if the button needs to be disabled.
     */
    _disabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _screensharing: boolean;
}

const styles = {
    screenCapturePickerView: {
        display: 'none'
    }
};

/**
 * An implementation of a button for toggling screen sharing on iOS.
 */
class ScreenSharingIosButton extends AbstractButton<IProps> {
    _nativeComponent: React.Component<any, any> | null;

    override accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    override icon = IconScreenshare;
    override label = 'toolbar.startScreenSharing';
    override toggledLabel = 'toolbar.stopScreenSharing';

    /**
   * Initializes a new {@code ScreenSharingIosButton} instance.
   *
   * @param {Object} props - The React {@code Component} props to initialize
   * the new {@code ScreenSharingIosButton} instance with.
   */
    constructor(props: IProps) {
        super(props);

        this._nativeComponent = null;

        // Bind event handlers so they are only bound once per instance.
        this._setNativeComponent = this._setNativeComponent.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    override render() {
        return (
            <>
                { super.render() }
                <ScreenCapturePickerView
                    ref = { this._setNativeComponent } // @ts-ignore
                    style = { styles.screenCapturePickerView } />
            </>
        );
    }

    /**
    * Sets the internal reference to the React Component wrapping the
    * {@code RPSystemBroadcastPickerView} component.
    *
    * @param {ReactComponent} component - React Component.
    * @returns {void}
    */
    _setNativeComponent(component: React.Component<any, any> | null) {
        this._nativeComponent = component;
    }

    /**
   * Handles clicking / pressing the button.
   *
   * @override
   * @protected
   * @returns {void}
   */
    override _handleClick() {
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
    override _isToggled() {
        return this.props._screensharing;
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
function _mapStateToProps(state: IReduxState) {
    const enabled = getFeatureFlag(state, IOS_SCREENSHARING_ENABLED, false);

    return {
        _screensharing: isLocalVideoTrackDesktop(state),

        // TODO: this should work on iOS 12 too, but our trick to show the picker doesn't work.
        visible: enabled
            && Platform.OS === 'ios'
            && Number.parseInt(Platform.Version.split('.')[0], 10) >= 14
    };
}

export default translate(connect(_mapStateToProps)(ScreenSharingIosButton));
