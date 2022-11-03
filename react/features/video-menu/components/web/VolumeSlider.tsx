import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconVolume } from '../../../base/icons/svg';
import { VOLUME_SLIDER_SCALE } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
interface IProps extends WithTranslation {

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The value of the audio slider should display at when the component first
     * mounts. Changes will be stored in state. The value should be a number
     * between 0 and 1.
     */
    initialValue: number;

    /**
     * The callback to invoke when the audio slider value changes.
     */
    onChange: Function;
}

/**
 * The type of the React {@code Component} state of {@link VolumeSlider}.
 */
interface IState {

    /**
     * The volume of the participant's audio element. The value will
     * be represented by a slider.
     */
    volumeLevel: number;
}

const styles = (theme: Theme) => {
    return {
        container: {
            minHeight: '40px',
            minWidth: '180px',
            width: '100%',
            boxSizing: 'border-box' as const,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0 5px',

            '&:hover': {
                backgroundColor: theme.palette.ui04
            }
        },

        icon: {
            minWidth: '20px',
            padding: '5px',
            position: 'relative' as const
        },

        sliderContainer: {
            position: 'relative' as const,
            width: '100%',
            paddingRight: '5px'
        },

        slider: {
            position: 'absolute' as const,
            width: '100%',
            top: '50%',
            transform: 'translate(0, -50%)'
        }
    };
};

/**
 * Implements a React {@link Component} which displays an input slider for
 * adjusting the local volume of a remote participant.
 *
 * @augments Component
 */
class VolumeSlider extends Component<IProps, IState> {
    /**
     * Initializes a new {@code VolumeSlider} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            volumeLevel: (props.initialValue || 0) * VOLUME_SLIDER_SCALE
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onVolumeChange = this._onVolumeChange.bind(this);
    }

    /**
     * Click handler.
     *
     * @param {MouseEvent} e - Click event.
     * @returns {void}
     */
    _onClick(e: React.MouseEvent) {
        e.stopPropagation();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { classes } = this.props;

        return (
            <div
                aria-label = { this.props.t('volumeSlider') }
                className = { clsx('popupmenu__contents', classes.container) }
                onClick = { this._onClick }>
                <span className = { classes.icon }>
                    <Icon
                        size = { 22 }
                        src = { IconVolume } />
                </span>
                <div className = { classes.sliderContainer }>
                    <input
                        aria-valuemax = { VOLUME_SLIDER_SCALE }
                        aria-valuemin = { 0 }
                        aria-valuenow = { this.state.volumeLevel }
                        className = { clsx('popupmenu__volume-slider', classes.slider) }
                        max = { VOLUME_SLIDER_SCALE }
                        min = { 0 }
                        onChange = { this._onVolumeChange }
                        tabIndex = { 0 }
                        type = 'range'
                        value = { this.state.volumeLevel } />
                </div>
            </div>
        );
    }

    /**
     * Sets the internal state of the volume level for the volume slider.
     * Invokes the prop onVolumeChange to notify of volume changes.
     *
     * @param {Object} event - DOM Event for slider change.
     * @private
     * @returns {void}
     */
    _onVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
        const volumeLevel = Number(event.currentTarget.value);

        this.props.onChange(volumeLevel / VOLUME_SLIDER_SCALE);
        this.setState({ volumeLevel });
    }
}

export default translate(withStyles(styles)(VolumeSlider));
