import React from 'react';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

interface IProps {
    size?: 'small' | 'medium' | 'large';
}

const SIZE = {
    small: 16,
    medium: 24,
    large: 48
};

const useStyles = makeStyles()(() => {
    return {
        container: {
            verticalAlign: 'middle',
            opacity: 0,
            animation: `${keyframes`
                0% {
                    transform: rotate(50deg);
                    opacity: 0;
                    stroke-dashoffset: 60;
                }
                100% {
                    transform: rotate(230deg);
                    opacity: 1;
                    stroke-dashoffset: 50;
                }
            `} 1s forwards ease-in-out`
        },

        circle: {
            fill: 'none',
            stroke: '#E6EDFA',
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            strokeDasharray: 60,
            strokeDashoffset: 'inherit',
            transformOrigin: 'center',
            animation: `${keyframes`
                0% {
                    transform: rotate(0);
                }
                100% {
                    transform: rotate(360deg);
                }
            `} 0.86s forwards infinite`,
            animationDelay: '0ms',
            animationTimingFunction: 'cubic-bezier(0.4, 0.15, 0.6, 0.85)'
        }
    };
});

const Spinner = ({ size = 'medium' }: IProps) => {
    const { classes } = useStyles();

    return (
        <svg
            className = { classes.container }
            focusable = 'false'
            height = { SIZE[size] }
            viewBox = '0 0 16 16'
            width = { SIZE[size] }
            xmlns = 'http://www.w3.org/2000/svg'>
            <circle
                className = { classes.circle }
                cx = '8'
                cy = '8'
                r = '7' />
        </svg>
    );
};

export default Spinner;
