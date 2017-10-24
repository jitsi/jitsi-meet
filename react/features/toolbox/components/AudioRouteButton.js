// @flow

import React, { Component } from 'react';
import {
    findNodeHandle,
    requireNativeComponent,
    NativeModules,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { AudioRoutePickerDialog } from '../../mobile/audio-mode';

import ToolbarButton from './ToolbarButton';

/**
 * Define the {@code MPVolumeView} React component. It will only be available
 * on iOS.
 */
let MPVolumeView;

if (NativeModules.MPVolumeViewManager) {
    MPVolumeView = requireNativeComponent('MPVolumeView', null);
}

/**
 * Style required to hide the {@code MPVolumeView} view, since it's displayed
 * programmatically.
 */
const HIDE_VIEW_STYLE = { display: 'none' };

type Props = {

    /**
     * Used to show the {@code AudioRoutePickerDialog}.
     */
    dispatch: Function,

    /**
     * The name of the Icon of this {@code AudioRouteButton}.
     */
    iconName: string,

    /**
     * The style of the Icon of this {@code AudioRouteButton}.
     */
    iconStyle: Object,

    /**
     * {@code AudioRouteButton} styles.
     */
    style: Array<*> | Object,

    /**
     * The color underlying the button.
     */
    underlayColor: string
};

/**
 * A toolbar button which triggers an audio route picker when pressed.
 */
class AudioRouteButton extends Component<Props> {
    _volumeComponent: ?Object;

    /**
     * Indicates if there is support for audio device selection via this button.
     *
     * @returns {boolean} - True if audio device selection is supported, false
     * otherwise.
     */
    static supported() {
        return Boolean(MPVolumeView || AudioRoutePickerDialog);
    }

    /**
     * Initializes a new {@code AudioRouteButton} instance.
     *
     * @param {Object} props - The React {@code Component} props to initialize
     * the new {@code AudioRouteButton} instance with.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the React {@code MPVolumeView} for
         * showing the volume control view.
         *
         * @private
         * @type {ReactComponent}
         */
        this._volumeComponent = null;

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._setVolumeComponent = this._setVolumeComponent.bind(this);
    }

    _onClick: () => void;

    /**
     * Handles clicking/pressing this {@code AudioRouteButton} by showing an
     * audio route picker.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        if (MPVolumeView) {
            const handle = findNodeHandle(this._volumeComponent);

            NativeModules.MPVolumeViewManager.show(handle);
        } else if (AudioRoutePickerDialog) {
            this.props.dispatch(openDialog(AudioRoutePickerDialog));
        }
    }

    _setVolumeComponent: (?Object) => void;

    /**
     * Sets the internal reference to the React Component wrapping the
     * {@code MPVolumeView} component.
     *
     * @param {ReactComponent} component - React Component.
     * @returns {void}
     */
    _setVolumeComponent(component) {
        this._volumeComponent = component;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { iconName, iconStyle, style, underlayColor } = this.props;

        return (
            <View>
                <ToolbarButton
                    iconName = { iconName }
                    iconStyle = { iconStyle }
                    onClick = { this._onClick }
                    style = { style }
                    underlayColor = { underlayColor } />
                {
                    MPVolumeView
                        && <MPVolumeView
                            ref = { this._setVolumeComponent }
                            style = { HIDE_VIEW_STYLE } />
                }
            </View>
        );
    }
}

export default connect()(AudioRouteButton);
