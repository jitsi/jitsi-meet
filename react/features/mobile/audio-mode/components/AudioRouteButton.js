// @flow

import React from 'react';
import {
    findNodeHandle,
    NativeModules,
    requireNativeComponent,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import AudioRoutePickerDialog from './AudioRoutePickerDialog';

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

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function used to open/show the
     * {@code AudioRoutePickerDialog}.
     */
    dispatch: Function
};

/**
 * A toolbar button which triggers an audio route picker when pressed.
 */
class AudioRouteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Audio route';
    iconName = 'icon-volume';
    label = 'toolbar.audioRoute';

    _volumeComponent: ?Object;

    /**
     * Initializes a new {@code AudioRouteButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code AudioRouteButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        /**
         * The internal reference to the React {@code MPVolumeView} for
         * showing the volume control view.
         *
         * @private
         * @type {ReactElement}
         */
        this._volumeComponent = null;

        // Bind event handlers so they are only bound once per instance.
        this._setVolumeComponent = this._setVolumeComponent.bind(this);
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        if (MPVolumeView) {
            NativeModules.MPVolumeViewManager.show(
                findNodeHandle(this._volumeComponent));
        } else if (AudioRoutePickerDialog) {
            this.props.dispatch(openDialog(AudioRoutePickerDialog));
        }
    }

    _setVolumeComponent: (?Object) => void;

    /**
     * Sets the internal reference to the React Component wrapping the
     * {@code MPVolumeView} component.
     *
     * @param {ReactElement} component - React Component.
     * @private
     * @returns {void}
     */
    _setVolumeComponent(component) {
        this._volumeComponent = component;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {?ReactElement}
     */
    render() {
        if (!MPVolumeView && !AudioRoutePickerDialog) {

            // $FlowFixMe
            return null;
        }

        const element = super.render();

        return (
            <View>
                { element }
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

export default translate(connect()(AudioRouteButton));
