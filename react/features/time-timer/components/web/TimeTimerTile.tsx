import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { TIME_TIMER_PARTICIPANT_ID } from '../../constants';

interface IProps {
    containerClassName: string;
    styles: any;
    thumbnailType: string;
}

const RADIUS = 80;
const CX = 100;
const CY = 100;

function polarToCartesian(angleDeg: number, r: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;

    return {
        x: CX + r * Math.cos(rad),
        y: CY + r * Math.sin(rad)
    };
}

function arcPath(fraction: number, r: number) {
    if (fraction <= 0) {
        return '';
    }
    if (fraction >= 1) {
        // Full circle drawn as two arcs
        const top = polarToCartesian(0, r);
        const mid = polarToCartesian(180, r);

        return [
            `M ${top.x} ${top.y}`,
            `A ${r} ${r} 0 0 1 ${mid.x} ${mid.y}`,
            `A ${r} ${r} 0 0 1 ${top.x} ${top.y}`,
            'Z'
        ].join(' ');
    }
    const endAngle = fraction * 360;
    const end = polarToCartesian(endAngle, r);
    const largeArc = endAngle > 180 ? 1 : 0;
    const start = polarToCartesian(0, r);

    return [
        `M ${CX} ${CY}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        'Z'
    ].join(' ');
}

const MINUTE_MARKERS = Array.from({ length: 60 }, (_, i) => i);
const LABEL_MINUTES = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ];

const TimeTimerTile = ({ containerClassName, styles }: IProps) => {
    const { remainingSeconds, durationSeconds } = useSelector(
        (state: IReduxState) => state['features/time-timer']
    );

    const fraction = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0;
    const minutes = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const timeLabel = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
        <span
            className = { containerClassName }
            id = { `participant_${TIME_TIMER_PARTICIPANT_ID}` }
            style = { {
                ...styles?.thumbnail,
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center'
            } }>
            <svg
                style = { { height: '100%', maxHeight: 200, maxWidth: 200, width: '100%' } }
                viewBox = '0 0 200 200'>
                {/* White background disk */}
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = '#ffffff'
                    r = { RADIUS } />

                {/* Red arc — remaining time */}
                {fraction > 0 && (
                    <path
                        d = { arcPath(fraction, RADIUS) }
                        fill = '#d32f2f' />
                )}

                {/* Outer ring */}
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = 'none'
                    r = { RADIUS }
                    stroke = '#333333'
                    strokeWidth = '2' />

                {/* Minute tick marks */}
                {MINUTE_MARKERS.map(i => {
                    const angle = (i / 60) * 360;
                    const isMajor = i % 5 === 0;
                    const inner = polarToCartesian(angle, isMajor ? RADIUS - 10 : RADIUS - 5);
                    const outer = polarToCartesian(angle, RADIUS);

                    return (
                        <line
                            key = { i }
                            stroke = '#333333'
                            strokeWidth = { isMajor ? 2 : 1 }
                            x1 = { inner.x }
                            x2 = { outer.x }
                            y1 = { inner.y }
                            y2 = { outer.y } />
                    );
                })}

                {/* Minute labels */}
                {LABEL_MINUTES.map(i => {
                    const angle = (i / 60) * 360;
                    const pos = polarToCartesian(angle, RADIUS - 18);
                    const label = i === 0 ? '0' : String(i);

                    return (
                        <text
                            dominantBaseline = 'middle'
                            fill = '#333333'
                            fontSize = '10'
                            fontWeight = 'bold'
                            key = { i }
                            textAnchor = 'middle'
                            x = { pos.x }
                            y = { pos.y }>
                            {label}
                        </text>
                    );
                })}

                {/* Center hub */}
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = '#333333'
                    r = { 6 } />
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = '#f5c518'
                    r = { 3 } />

                {/* Countdown label */}
                <text
                    dominantBaseline = 'middle'
                    fill = '#ffffff'
                    fontSize = '13'
                    fontWeight = 'bold'
                    textAnchor = 'middle'
                    x = { CX }
                    y = { CY + 30 }>
                    {timeLabel}
                </text>
            </svg>
        </span>
    );
};

export default TimeTimerTile;
