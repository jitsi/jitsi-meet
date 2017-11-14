// @flow

import React, { Component } from 'react';
import {
    findNodeHandle,
    NativeModules,
    requireNativeComponent,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { AudioRoutePickerDialog } from '../../mobile/audio-mode';

import ToolbarButton from './ToolbarButton';

/**
 * The {@code MPVolumeView} React {@code Component}. It will only be available
 * on iOS.
 */
const MPVolumeView
    = NativeModules.MPVolumeViewManager
        && requireNativeComponent('MPVolumeView', null);

/**
 * The style required to hide the {@code MPVolumeView}, since it's displayed
 * programmatically.
 */
const HIDE_VIEW_STYLE = { display: 'none' };

type Props = {

    /**
     * The redux {@code dispatch} function used to open/show the
     * {@code AudioRoutePickerDialog}.
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
     * The style(s) of {@code AudioRouteButton}.
     */
    style: Array<*> | Object,

    /**
     * The color underlaying the button.
     */
    underlayColor: string
};

/**
 * A toolbar button which triggers an audio route picker when pressed.
 */
class AudioRouteButton extends Component<Props> {
    _volumeComponent: ?Object;

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
            NativeModules.MPVolumeViewManager.show(
                findNodeHandle(this._volumeComponent));
        } else if (AudioRoutePickerDialog) {
            this.props.dispatch(openDialog(AudioRoutePickerDialog));
        }
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

    _setVolumeComponent: (?Object) => void;

    /**
     * Sets the internal reference to the React Component wrapping the
     * {@code MPVolumeView} component.
     *
     * @param {ReactComponent} component - React Component.
     * @private
     * @returns {void}
     */
    _setVolumeComponent(component) {
        this._volumeComponent = component;
    }
}

export default (MPVolumeView || AudioRoutePickerDialog)
  && connect()(AudioRouteButton);
