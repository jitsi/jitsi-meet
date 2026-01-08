import React from 'react';
import { makeStyles } from 'tss-react/mui';

interface IProps {

    /**
     * The 'aria-label' text.
     */
    ariaLabel: string;

    /**
     * The maximum value for slider value.
     */
    max: number;

    /**
     * The minimum value for slider value.
     */
    min: number;

    /**
     * Callback invoked on change.
     */
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    /**
     * The granularity that the value must adhere to.
     */
    step: number;

    /**
     * The current value where the knob is positioned.
     */
    value: number;
}

const useStyles = makeStyles()(theme => {
    // keep the same height for all elements:
    // input, input track & fake track(div)
    const height = 6;

    const inputTrack = {
        background: 'transparent',
        height
    };
    const inputThumb = {
        background: theme.palette.text01,
        border: 0,
        borderRadius: '50%',
        height: 24,
        width: 24
    };

    const focused = {
        outline: `1px solid ${theme.palette.ui06}`
    };

    return {
        sliderContainer: {
            cursor: 'pointer',
            width: '100%',
            position: 'relative',
            textAlign: 'center'

        },
        knobContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            marginLeft: 2,
            marginRight: 2,
            position: 'absolute',
            width: '100%'
        },
        knob: {
            background: theme.palette.text01,
            borderRadius: '50%',
            display: 'inline-block',
            height,
            width: 6
        },
        track: {
            background: theme.palette.text03,
            borderRadius: Number(theme.shape.borderRadius) / 2,
            height
        },
        slider: {
            // Use an additional class here to override global CSS specificity
            '&.custom-slider': {
                '-webkit-appearance': 'none',
                background: 'transparent',
                height,
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',

                '&.focus-visible': {
                    // override global styles in order to use our own color
                    outline: 'none !important',

                    '&::-webkit-slider-runnable-track': focused,
                    '&::ms-track': focused,
                    '&::-moz-range-track': focused
                },

                '&::-webkit-slider-runnable-track': {
                    '-webkit-appearance': 'none',
                    ...inputTrack
                },
                '&::-webkit-slider-thumb': {
                    '-webkit-appearance': 'none',
                    position: 'relative',
                    top: -6,
                    ...inputThumb
                },

                '&::ms-track': {
                    ...inputTrack
                },
                '&::-ms-thumb': {
                    ...inputThumb
                },

                '&::-moz-range-track': {
                    ...inputTrack
                },
                '&::-moz-range-thumb': {
                    ...inputThumb
                }
            }
        }
    };
});

/**
 *  Custom slider.
 *
 *  @returns {ReactElement}
 */
function Slider({ ariaLabel, max, min, onChange, step, value }: IProps) {
    const { classes, cx } = useStyles();
    const knobs = [ ...Array(Math.floor((max - min) / step) + 1) ];

    return (
        <div className = { classes.sliderContainer }>
            <ul
                aria-hidden = { true }
                className = { cx('empty-list', classes.knobContainer) }>
                {knobs.map((_, i) => (
                    <li
                        className = { classes.knob }
                        key = { `knob-${i}` } />))}
            </ul>
            <div className = { classes.track } />
            <input
                aria-label = { ariaLabel }
                className = { cx(classes.slider, 'custom-slider') }
                max = { max }
                min = { min }
                onChange = { onChange }
                step = { step }
                type = 'range'
                value = { value } />
        </div>
    );
}

export default Slider;
