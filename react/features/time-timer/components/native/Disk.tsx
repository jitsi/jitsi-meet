import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { EXPIRED_DISK_COLOR, EXPIRED_OVERRUN_EDGE_COLOR } from '../../functions';

/**
 * Native SVG disk renderer used by {@code TimeTimerLabel}. This is the
 * react-native counterpart of web's {@code components/web/Disk}: it draws a
 * ring with an optional filled wedge growing clockwise from 12 o'clock.
 *
 * During overrun lap 2+ (once the disk has filled once) web overlays a CSS
 * {@code conic-gradient} that runs from {@code EXPIRED_DISK_COLOR} at the 12
 * o'clock origin to {@code EXPIRED_OVERRUN_EDGE_COLOR} at the current leading
 * edge, then back to the base colour for the rest of the disk. Since
 * react-native-svg has no conic gradient, we reproduce the SAME math by
 * slicing the swept region into many thin angular wedges and filling each with
 * the colour the gradient would have at that angle — visually identical to the
 * web overlay.
 */

const CX = 50;
const CY = 50;
const RADIUS = 46;

// Number of thin angular slices used to emulate web's conic gradient across
// the swept region. 60 keeps each slice ≤ a few degrees, so the banding is
// imperceptible at the pill's disk size while staying cheap to render.
const OVERRUN_SLICES = 60;

/**
 * Converts a polar coordinate (clock angle in degrees, 0 = 12 o'clock) to
 * cartesian coordinates on the disk. Identical to web's {@code Disk}.
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
 * the disk, drawn clockwise from the top. Identical to web's {@code Disk}.
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


/**
 * Linearly interpolates between two #rrggbb hex colours.
 *
 * @param {string} from - Start colour (#rrggbb).
 * @param {string} to - End colour (#rrggbb).
 * @param {number} t - Interpolation factor, 0..1.
 * @returns {string}
 */
function lerpHexColor(from: string, to: string, t: number): string {
    const f = parseInt(from.slice(1), 16);
    const g = parseInt(to.slice(1), 16);
    const fr = (f >> 16) & 0xff, fg = (f >> 8) & 0xff, fb = f & 0xff;
    const gr = (g >> 16) & 0xff, gg = (g >> 8) & 0xff, gb = g & 0xff;
    const r = Math.round(fr + ((gr - fr) * t));
    const gc = Math.round(fg + ((gg - fg) * t));
    const b = Math.round(fb + ((gb - fb) * t));

    return `#${((1 << 24) + (r << 16) + (gc << 8) + b).toString(16).slice(1)}`;
}

/**
 * Builds a filled pie-wedge path spanning [startDeg, endDeg] clockwise from
 * the 12 o'clock origin. Used to emulate the conic gradient one thin slice at
 * a time.
 *
 * @param {number} startDeg - Start angle in degrees.
 * @param {number} endDeg - End angle in degrees.
 * @returns {string}
 */
function slicePath(startDeg: number, endDeg: number): string {
    const start = polarToCartesian(startDeg, RADIUS);
    const end = polarToCartesian(endDeg, RADIUS);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;

    return [
        `M ${CX} ${CY}`,
        `L ${start.x} ${start.y}`,
        `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        'Z'
    ].join(' ');
}

interface IProps {

    /**
     * Fill colour for the disk (blue / amber / red per timer state).
     */
    color: string;

    /**
     * Fraction of the disk to fill (0..1).
     */
    fraction: number;

    /**
     * Angular position (degrees, clockwise from the top) of the leading edge
     * of the overrun sweep during lap 2 and onward. When provided, the
     * conic-gradient sweep (base colour → darker edge colour) is drawn from
     * the origin to this angle over the fully filled disk.
     */
    overrunArcEndDeg?: number;

    /**
     * Rendered size (width and height) of the disk in points.
     */
    size: number;
}

/**
 * Renders the time-timer disk as a ring with an optional filled wedge, plus a
 * stroked overrun arc during lap 2+.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
const Disk = ({ color, fraction, overrunArcEndDeg, size }: IProps) => {
    const showOverrun = typeof overrunArcEndDeg === 'number';
    const wedge = wedgePath(fraction);

    // Reproduce web's conic gradient over the swept region [0, deg]: base
    // colour at the origin fading to the darker edge colour at the leading
    // edge, matched slice-by-slice. The remainder of the disk stays the base
    // colour (already painted by the full wedge below).
    let overrunSlices: React.ReactElement[] = [];

    if (showOverrun) {
        const deg = Math.max(0, Math.min(360, overrunArcEndDeg ?? 0));
        const step = deg / OVERRUN_SLICES;

        overrunSlices = Array.from({ length: OVERRUN_SLICES }, (_, i) => {
            const a0 = i * step;
            const a1 = (i + 1) * step;

            // Colour the gradient would have at the middle of this slice.
            const t = deg > 0 ? ((a0 + a1) / 2) / deg : 0;

            return (
                <Path
                    d = { slicePath(a0, a1) }
                    fill = { lerpHexColor(EXPIRED_DISK_COLOR, EXPIRED_OVERRUN_EDGE_COLOR, t) }
                    key = { i } />
            );
        });
    }

    return (
        <Svg
            height = { size }
            viewBox = '0 0 100 100'
            width = { size }>
            {/*
              * Faint 5% white fill behind the wedge so the unfilled portion
              * reads as a subtle lighter shape against the navy chip
              * background. Drawn FIRST so the wedge paints over it.
              */}
            <Circle
                cx = { CX }
                cy = { CY }
                fill = '#FFFFFF'
                fillOpacity = { 0.05 }
                r = { RADIUS } />
            <Circle
                cx = { CX }
                cy = { CY }
                fill = 'none'
                r = { RADIUS }
                stroke = { color }
                strokeWidth = { 6 } />
            { wedge !== '' && (
                <Path
                    d = { wedge }
                    fill = { color } />
            ) }
            { overrunSlices }
        </Svg>
    );
};

export default Disk;
