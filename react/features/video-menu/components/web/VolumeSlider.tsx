import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconVolumeUp } from '../../../base/icons/svg';
import { VOLUME_SLIDER_SCALE } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
interface IProps {

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

const useStyles = makeStyles()(theme => {
    return {
        container: {
            minHeight: '40px',
            minWidth: '180px',
            width: '100%',
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px',

            '&:hover': {
                backgroundColor: theme.palette.ui02
            }
        },

        icon: {
            minWidth: '20px',
            marginRight: '16px',
            position: 'relative'
        },

        sliderContainer: {
            position: 'relative',
            width: '100%'
        },

        slider: {
            position: 'absolute',
            width: '100%',
            top: '50%',
            transform: 'translate(0, -50%)'
        }
    };
});

const _onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
};

const VolumeSlider = ({
    initialValue,
    onChange
}: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();

    const [ volumeLevel, setVolumeLevel ] = useState((initialValue || 0) * VOLUME_SLIDER_SCALE);

    const _onVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolumeLevel = Number(event.currentTarget.value);

        onChange(newVolumeLevel / VOLUME_SLIDER_SCALE);
        setVolumeLevel(newVolumeLevel);
    }, [ onChange ]);

    return (
        <div
            aria-label = { t('volumeSlider') }
            className = { cx('popupmenu__contents', classes.container) }
            onClick = { _onClick }>
            <span className = { classes.icon }>
                <Icon
                    size = { 22 }
                    src = { IconVolumeUp } />
            </span>
            <div className = { classes.sliderContainer }>
                <input
                    aria-valuemax = { VOLUME_SLIDER_SCALE }
                    aria-valuemin = { 0 }
                    aria-valuenow = { volumeLevel }
                    className = { cx('popupmenu__volume-slider', classes.slider) }
                    max = { VOLUME_SLIDER_SCALE }
                    min = { 0 }
                    onChange = { _onVolumeChange }
                    tabIndex = { 0 }
                    type = 'range'
                    value = { volumeLevel } />
            </div>
        </div>
    );
};

export default VolumeSlider;
