/* @flow */

import React, { Component } from 'react';

import { Icon, IconVolume } from '../../../base/icons';

/**
 * Used to modify initialValue, which is expected to be a decimal value between
 * 0 and 1, and converts it to a number representable by an input slider, which
 * recognizes whole numbers.
 */
const VOLUME_SLIDER_SCALE = 100;

/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
type Props = {

    /**
     * The value of the audio slider should display at when the component first
     * mounts. Changes will be stored in state. The value should be a number
     * between 0 and 1.
     */
    initialValue: number,

    /**
     * The callback to invoke when the audio slider value changes.
     */
    onChange: Function
};

/**
 * The type of the React {@code Component} state of {@link VolumeSlider}.
 */
type State = {

    /**
     * The volume of the participant's audio element. The value will
     * be represented by a slider.
     */
    volumeLevel: number
};

/**
 * Implements a React {@link Component} which displays an input slider for
 * adjusting the local volume of a remote participant.
 *
 * @extends Component
 */
class VolumeSlider extends Component<Props, State> {
    /**
     * Initializes a new {@code VolumeSlider} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            volumeLevel: (props.initialValue || 0) * VOLUME_SLIDER_SCALE
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onVolumeChange = this._onVolumeChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <li className = 'popupmenu__item'>
                <div className = 'popupmenu__contents'>
                    <span className = 'popupmenu__icon'>
                        <Icon src = { IconVolume } />
                    </span>
                    <div className = 'popupmenu__slider_container'>
                        <input
                            className = 'popupmenu__slider'
                            max = { VOLUME_SLIDER_SCALE }
                            min = { 0 }
                            onChange = { this._onVolumeChange }
                            type = 'range'
                            value = { this.state.volumeLevel } />
                    </div>
                </div>
            </li>
        );
    }

    _onVolumeChange: (Object) => void;

    /**
     * Sets the internal state of the volume level for the volume slider.
     * Invokes the prop onVolumeChange to notify of volume changes.
     *
     * @param {Object} event - DOM Event for slider change.
     * @private
     * @returns {void}
     */
    _onVolumeChange(event) {
        const volumeLevel = event.currentTarget.value;

        this.props.onChange(volumeLevel / VOLUME_SLIDER_SCALE);
        this.setState({ volumeLevel });
    }
}

export default VolumeSlider;
