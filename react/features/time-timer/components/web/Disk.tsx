import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { EXPIRED_DISK_COLOR, EXPIRED_OVERRUN_EDGE_COLOR } from '../../functions';

/**
 * SVG disk renderer used by {@code TimeTimerPill}. Draws a ring with an
 * optional filled wedge. During overrun lap 2+ (once the disk has filled
 * once), an additional CSS conic-gradient overlay conveys the ongoing
 * sweep — a continuous gradient from the base red at the 12 o'clock origin
 * to a darker red at the current leading edge.
 */

const CX = 50;
const CY = 50;
const RADIUS = 46;

/**
 * Converts a polar coordinate (clock angle in degrees, 0 = 12 o'clock) to
 * cartesian coordinates on the disk.
 *
 * @param {number} angleDeg - Angle in degrees, clockwise from the top.
 * @param {number} r - Radius.
 * @returns {{ x: number, y: number }}
 */
function polarToCartesian(angleDeg: number, r: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;

    return {
        x: CX + (r * Math.cos(rad)),
        y: CY + (r * Math.sin(rad))
    };
}

/**
 * Builds an SVG path for a filled pie wedge covering the given fraction of
 * the disk, drawn clockwise from the top.
 *
 * @param {number} fraction - Fraction of the disk to fill (0..1).
 * @returns {string}
 */
function wedgePath(fraction: number): string {
    const clamped = Math.max(0, Math.min(1, fraction));

    if (clamped <= 0) {
        return '';
    }
    if (clamped >= 1) {
        const top = polarToCartesian(0, RADIUS);
        const bottom = polarToCartesian(180, RADIUS);

        return [
            `M ${top.x} ${top.y}`,
            `A ${RADIUS} ${RADIUS} 0 0 1 ${bottom.x} ${bottom.y}`,
            `A ${RADIUS} ${RADIUS} 0 0 1 ${top.x} ${top.y}`,
            'Z'
        ].join(' ');
    }

    const endAngle = clamped * 360;
    const start = polarToCartesian(0, RADIUS);
    const end = polarToCartesian(endAngle, RADIUS);
    const largeArc = endAngle > 180 ? 1 : 0;

    return [
        `M ${CX} ${CY}`,
        `L ${start.x} ${start.y}`,
        `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        'Z'
    ].join(' ');
}

interface IProps {
    color: string;
    fraction: number;

    /**
     * Angular position (degrees, clockwise from the top / 12 o'clock) of
     * the leading edge of the overrun sweep during lap 2 and onward. When
     * provided, the disk renders a conic-gradient overlay from the base
     * red at the origin to a darker red at this angle, over the (fully
     * filled) base disk.
     */
    overrunArcEndDeg?: number;
    size: number;
}

const useStyles = makeStyles<{ size: number; }>()((_theme, { size }) => {
    return {
        root: {
            flex: '0 0 auto',
            height: size,
            position: 'relative',
            width: size
        },

        svg: {
            display: 'block',
            height: size,
            width: size
        },

        // Circular element overlaid exactly on top of the solid SVG disk. Its
        // conic-gradient background is applied inline (see below) rather than
        // here: the leading-edge angle changes every second during overrun, so
        // baking it into a tss-react style would generate a fresh CSS class on
        // every tick. The static positioning stays here.
        overrunOverlay: {
            borderRadius: '50%',
            inset: 0,
            position: 'absolute'
        }
    };
});

/**
 * Builds the lap-2+ overrun sweep — a conic gradient running clockwise from
 * the 12 o'clock origin: base red → darker red at the current leading edge,
 * then back to base red for the remainder (already filled from lap 1).
 *
 * @param {number} deg - Angular position of the leading edge, in degrees.
 * @returns {string}
 */
function overrunGradient(deg: number): string {
    return `conic-gradient(from 0deg, ${EXPIRED_DISK_COLOR} 0deg, `
        + `${EXPIRED_OVERRUN_EDGE_COLOR} ${deg}deg, `
        + `${EXPIRED_DISK_COLOR} ${deg}deg, ${EXPIRED_DISK_COLOR} 360deg)`;
}

/**
 * Renders the time-timer disk as a ring with an optional filled wedge, plus
 * a conic-gradient overrun sweep during lap 2+.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
const Disk = ({ color, fraction, overrunArcEndDeg, size }: IProps) => {
    const { classes } = useStyles({ size });
    const showOverrun = typeof overrunArcEndDeg === 'number';

    return (
        <div className = { classes.root }>
            <svg
                className = { classes.svg }
                viewBox = '0 0 100 100'>
                {/*
                  * Per Figma: a faint 5% white fill behind the wedge so the
                  * unfilled portion of the disk reads as a subtle lighter
                  * shape against the navy chip background. Drawn FIRST so the
                  * wedge paints over it.
                  */}
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = '#FFFFFF'
                    fillOpacity = '0.05'
                    r = { RADIUS } />
                <circle
                    cx = { CX }
                    cy = { CY }
                    fill = 'none'
                    r = { RADIUS }
                    stroke = { color }
                    strokeWidth = '6' />
                {fraction > 0 && (
                    <path
                        d = { wedgePath(fraction) }
                        fill = { color } />
                )}
            </svg>
            {showOverrun && (
                <div
                    className = { classes.overrunOverlay }
                    style = {{ background: overrunGradient(overrunArcEndDeg ?? 0) }} />
            )}
        </div>
    );
};

export default Disk;
