import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { getConferenceName } from '../../../base/conference/functions';
import { getLocalizedDurationFormatter } from '../../../base/i18n/dateUtil';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import {
    EXPIRED_NAME_SEGMENT_BG,
    EXPIRED_PILL_TEXT_COLOR,
    EXPIRED_TIMER_SEGMENT_BG,
    WARNING_COLOR,
    WARNING_NAME_SEGMENT_BG,
    WARNING_TIMER_SEGMENT_BG,
    getTimerVisualState,
    isTimeTimerEnabled
} from '../../functions';

import Disk from './Disk';

// Geometry — matches the Figma spec: 28px tall pill, 20px disk, 6px corner
// radius, two side-by-side segments with their own paddings and backgrounds.
const PILL_HEIGHT = 28;
const DISK_SIZE = 20;
const BORDER_RADIUS = 6;

// Per Figma: left segment uses 12px horizontal padding around the meeting
// name + scheduled duration; right segment uses 4px vertical / 8px horizontal
// padding around the remaining-time digits + disk.
const NAME_SEGMENT_PAD_X = '12px';
const TIMER_SEGMENT_PAD_X = '8px';
const TIMER_SEGMENT_PAD_Y = '4px';
const NAME_GAP = '8px';
const TIMER_GAP = '8px';

// Figma palette — deep navy + lighter navy + bright blue, replacing the
// previous translucent-black backgrounds.
const NAME_SEGMENT_BG = '#1F3057';
const TIMER_SEGMENT_BG = '#1A2542';
const REMAINING_TEXT_COLOR = '#82C3FE';

// When collapsed the pill becomes a 36×28 chip — per Figma, slightly wider
// than tall, with 8px horizontal and 4px vertical padding around the 20px
// disk. The same `4px 8px` padding the right-segment uses while expanded
// keeps the disk's position consistent through the collapse animation.
const COLLAPSED_WIDTH = '36px';
const COLLAPSED_DISK_PAD_X = '8px';
const COLLAPSED_DISK_PAD_Y = '4px';

// Collapse / expand timing — matches the surrounding `.subject` info bar's
// `.6s ease-in-out` fade (see _subject.scss) so the morph stays in sync.
const TIMING = '.6s ease-in-out';
const CONTAINER_TRANSITION = `max-width ${TIMING}`;
const SEGMENT_TRANSITION = `padding ${TIMING}`;
const TEXT_TRANSITION = `opacity ${TIMING}`;

const useStyles = makeStyles()(theme => {
    return {
        // Outer clipping container. A single `max-width` transition shrinks
        // this from the natural pill width down to the chip width; everything
        // inside is right-anchored (`justify-content: flex-end`) so the LEFT
        // side gets clipped off as the box narrows, producing a smooth
        // single-property morph from full pill → disk-only chip. The outer
        // border-radius means the visible portion always has matching rounded
        // corners on whichever side currently shows.
        container: {
            ...theme.typography.labelRegular,
            borderRadius: `${BORDER_RADIUS}px`,
            boxSizing: 'border-box',
            color: theme.palette.text01,
            display: 'flex',
            height: PILL_HEIGHT,
            justifyContent: 'flex-end',
            // Bound the expanded width so the max-width transition has an
            // immediate visual effect. Names longer than 324px are already
            // truncated with ellipsis (see `nameSegment.maxWidth`), so this
            // figure is a safe ceiling for the full pill.
            maxWidth: '450px',
            overflow: 'hidden',
            transition: CONTAINER_TRANSITION,

            '@media (max-width: 300px)': {
                display: 'none'
            }
        },

        containerCollapsed: {
            maxWidth: COLLAPSED_WIDTH
        },

        // Left segment: meeting name + scheduled duration. Lighter navy.
        nameSegment: {
            alignItems: 'center',
            backgroundColor: NAME_SEGMENT_BG,
            display: 'flex',
            flex: '0 0 auto',
            gap: NAME_GAP,
            maxWidth: '324px',
            paddingLeft: NAME_SEGMENT_PAD_X,
            paddingRight: NAME_SEGMENT_PAD_X
        },

        // Text spans fade to opacity 0 in lock-step with the width collapse
        // so the pill's content visually dissolves into the shrinking shape
        // rather than getting hard-clipped at the container's edge.
        name: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: TEXT_TRANSITION,
            whiteSpace: 'nowrap'
        },

        scheduled: {
            flex: '0 0 auto',
            fontVariantNumeric: 'tabular-nums',
            transition: TEXT_TRANSITION,
            whiteSpace: 'nowrap'
        },

        // Right segment: elapsed time + disk. Deeper navy. Keeps its
        // natural width while expanded — the outer container's collapsing
        // max-width is what clips everything to the left of the disk away.
        // When collapsed, the left/right paddings shrink so the disk sits
        // symmetrically in a square chip — that subtle right-side pull-in
        // (along with the much larger left-side clip via max-width) makes
        // the morph feel like the shape closes in from both directions
        // rather than just the left.
        timerSegment: {
            alignItems: 'center',
            backgroundColor: TIMER_SEGMENT_BG,
            display: 'flex',
            flex: '0 0 auto',
            gap: TIMER_GAP,
            paddingBottom: TIMER_SEGMENT_PAD_Y,
            paddingLeft: TIMER_SEGMENT_PAD_X,
            paddingRight: TIMER_SEGMENT_PAD_X,
            paddingTop: TIMER_SEGMENT_PAD_Y,
            transition: SEGMENT_TRANSITION
        },

        timerSegmentCollapsed: {
            paddingBottom: COLLAPSED_DISK_PAD_Y,
            paddingLeft: COLLAPSED_DISK_PAD_X,
            paddingRight: COLLAPSED_DISK_PAD_X,
            paddingTop: COLLAPSED_DISK_PAD_Y
        },

        // Remaining-time digits — Inter regular at the same size/spacing as
        // Figma's "Labels/labelBold" spec, just dropped to weight 400 per
        // design feedback. Colour comes from the active state class
        // (`elapsedWarning`, `elapsedExpired`) or falls back to the
        // bright `#82C3FE` baseline.
        elapsed: {
            color: REMAINING_TEXT_COLOR,
            flex: '0 0 auto',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontStyle: 'normal',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 400,
            letterSpacing: '0.16px',
            lineHeight: '16px',
            transition: TEXT_TRANSITION,
            whiteSpace: 'nowrap'
        },

        // During the final minutes (warning window) the elapsed digits go
        // amber to match the disk colour change.
        elapsedWarning: {
            color: WARNING_COLOR
        },

        // Warning-state segment backgrounds — same lighter-left /
        // deeper-right pattern as the blue baseline, but in warm browns.
        nameSegmentWarning: {
            backgroundColor: WARNING_NAME_SEGMENT_BG
        },

        timerSegmentWarning: {
            backgroundColor: WARNING_TIMER_SEGMENT_BG
        },

        // Expired-state segment backgrounds — warm wine tones with the same
        // lighter-left / deeper-right pattern. More urgent than warning;
        // expired overrides warning when both could apply (though in
        // practice they're mutually exclusive).
        nameSegmentExpired: {
            backgroundColor: EXPIRED_NAME_SEGMENT_BG
        },

        timerSegmentExpired: {
            backgroundColor: EXPIRED_TIMER_SEGMENT_BG
        },

        // Once the timer has expired, the elapsed value shifts to a soft
        // pink to flag that the meeting is now over schedule.
        elapsedExpired: {
            color: EXPIRED_PILL_TEXT_COLOR
        },

        textHidden: {
            opacity: 0
        }
    };
});

/**
 * Time-timer pill rendered in the always-visible conference info row.
 *
 * Shows the meeting name + scheduled duration on the left and the elapsed
 * time + countdown disk on the right. When the toolbox auto-hides, the pill
 * smoothly retracts from left to right via a single `max-width` transition
 * on the outer container — content is anchored to the right edge and clipped
 * by the container's rounded corners as it narrows, leaving a chip-sized
 * dark rectangle around the disk.
 *
 * Living in `alwaysVisible` (rather than `autoHide`) is what lets us keep
 * something rendered while the rest of the bar collapses, so the disk stays
 * visible to the user at all times.
 *
 * Elapsed-time formatting reuses {@code getLocalizedDurationFormatter} — the
 * same util used by Jitsi's {@code ConferenceTimer} — for consistency.
 *
 * @returns {ReactElement | null}
 */
const TimeTimerPill = () => {
    const { classes } = useStyles();
    const timerState = useSelector((state: IReduxState) => state['features/time-timer']);
    const timerEnabled = useSelector(isTimeTimerEnabled);
    const meetingName = useSelector(getConferenceName);
    const toolboxVisible = useSelector(isToolboxVisible);

    if (!timerEnabled || !timerState.running) {
        return null;
    }

    const { elapsedSeconds, fillColor, fraction, overrunArcEndDeg, warning } = getTimerVisualState(timerState);
    const { expired } = timerState;
    const scheduled = getLocalizedDurationFormatter(timerState.durationSeconds * 1000);
    const elapsed = getLocalizedDurationFormatter(elapsedSeconds * 1000);
    const collapsed = !toolboxVisible;

    // Expired wins over warning if both somehow applied — the red colour is
    // more urgent. In practice they're mutually exclusive (warning is gated
    // on `!expired` in getTimerVisualState).
    let nameSegmentStateClass = '';
    let timerSegmentStateClass = '';
    let elapsedStateClass = '';

    if (expired) {
        nameSegmentStateClass = ` ${classes.nameSegmentExpired}`;
        timerSegmentStateClass = ` ${classes.timerSegmentExpired}`;
        elapsedStateClass = ` ${classes.elapsedExpired}`;
    } else if (warning) {
        nameSegmentStateClass = ` ${classes.nameSegmentWarning}`;
        timerSegmentStateClass = ` ${classes.timerSegmentWarning}`;
        elapsedStateClass = ` ${classes.elapsedWarning}`;
    }

    const containerClass
        = `${classes.container}${collapsed ? ` ${classes.containerCollapsed}` : ''}`;
    const nameSegmentClass = `${classes.nameSegment}${nameSegmentStateClass}`;
    const timerSegmentClass = `${classes.timerSegment}`
        + `${collapsed ? ` ${classes.timerSegmentCollapsed}` : ''}`
        + timerSegmentStateClass;
    const hiddenClass = collapsed ? ` ${classes.textHidden}` : '';
    const elapsedClass = `${classes.elapsed}${elapsedStateClass}${hiddenClass}`;

    return (
        <div
            className = { containerClass }
            data-testid = 'time-timer-pill'>
            <div className = { nameSegmentClass }>
                <span className = { `${classes.name}${hiddenClass}` }>{ meetingName }</span>
                <span className = { `${classes.scheduled}${hiddenClass}` }>({ scheduled })</span>
            </div>
            <div className = { timerSegmentClass }>
                <span className = { elapsedClass }>{ elapsed }</span>
                <Disk
                    color = { fillColor }
                    fraction = { fraction }
                    overrunArcEndDeg = { overrunArcEndDeg }
                    size = { DISK_SIZE } />
            </div>
        </div>
    );
};

export default TimeTimerPill;
