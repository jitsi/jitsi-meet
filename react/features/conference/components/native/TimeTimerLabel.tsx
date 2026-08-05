import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalizedDurationFormatter } from '../../../base/i18n/dateUtil';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Disk from '../../../time-timer/components/native/Disk';
import {
    EXPIRED_NAME_SEGMENT_BG,
    EXPIRED_PILL_TEXT_COLOR,
    EXPIRED_TIMER_SEGMENT_BG,
    WARNING_COLOR,
    WARNING_NAME_SEGMENT_BG,
    WARNING_TIMER_SEGMENT_BG,
    getTimerVisualState,
    isTimeTimerEnabled
} from '../../../time-timer/functions';

// Geometry — the desktop pill's Figma spec (see web/TimeTimerPill), scaled to
// sit 28pt tall so it aligns exactly with the Record/Transcribe labels in the
// always-on row (LABEL_SIZE = 28 in base/label styles).
const PILL_HEIGHT = 28;
const DISK_SIZE = 20;

// Matches the 3pt radius the base Label uses for the Record/Transcribe chips
// in the same row (base/label/components/native/styles) so the pill's corners
// are identical to its neighbours'.
const BORDER_RADIUS = 3;

// Baseline navy palette — deep navy left segment, deeper navy right segment,
// bright blue elapsed digits. Same hexes as the web pill.
const NAME_SEGMENT_BG = '#1F3057';
const TIMER_SEGMENT_BG = '#1A2542';
const REMAINING_TEXT_COLOR = '#82C3FE';

// Symmetric horizontal padding used by BOTH segments so the pill reads
// evenly. 8pt matches web's timer-segment / collapsed-chip padding.
const SEGMENT_PAD_X = 8;

// Collapse/expand timing — web uses .6s; keep the same feel here.
const COLLAPSE_DURATION = 600;

const styles = StyleSheet.create({
    // Outer row wrapper. The rounded corners live on the segments themselves
    // (left segment rounds its left corners, right segment its right corners)
    // rather than relying on `overflow: 'hidden'` to clip child backgrounds,
    // which RN doesn't do reliably for nested background colours.
    // marginRight/marginBottom match the Record label's indicatorStyle so the
    // pill aligns with the other labels in the row.
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        height: PILL_HEIGHT,
        marginBottom: 0,
        marginRight: 4
    },

    // Left segment: scheduled duration. Lighter navy, left corners rounded.
    scheduledSegment: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderBottomLeftRadius: BORDER_RADIUS,
        borderTopLeftRadius: BORDER_RADIUS,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: SEGMENT_PAD_X
    },

    scheduled: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.text01
    },

    // Right segment: elapsed time + disk. Deeper navy, right corners rounded.
    timerSegment: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderBottomRightRadius: BORDER_RADIUS,
        borderTopRightRadius: BORDER_RADIUS,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: SEGMENT_PAD_X
    },

    elapsed: {
        ...BaseTheme.typography.labelRegular,
        marginRight: 8
    },

    // Collapsed chip — the disk alone in a fully-rounded square, deeper navy.
    // This is what web retracts to when the toolbox hides.
    collapsedChip: {
        alignItems: 'center',
        borderRadius: BORDER_RADIUS,
        height: PILL_HEIGHT,
        justifyContent: 'center',
        marginBottom: 0,
        marginRight: 4,
        paddingHorizontal: SEGMENT_PAD_X
    }
});

/**
 * A faithful native port of web's two-segment time-timer pill, scaled to the
 * 28pt always-on label height so it aligns with the Record/Transcribe labels.
 * The left segment shows the meeting name + scheduled duration; the right
 * segment shows the elapsed time + a circular progress {@code Disk}. All
 * colours (blue baseline / amber warning / red expired) come from the shared
 * {@code getTimerVisualState}, so the behaviour matches desktop exactly.
 *
 * When the toolbox auto-hides, the pill retracts to a disk-only chip
 * (cross-faded) — mirroring web's collapse to its end state.
 *
 * @returns {ReactElement|null}
 */
const TimeTimerLabel = () => {
    const timerState = useSelector((state: IReduxState) => state['features/time-timer']);
    const timerEnabled = useSelector(isTimeTimerEnabled);

    // Collapse when the toolbar is visually hidden. We read the RAW toolbox
    // `visible` flag rather than the `isToolboxVisible` selector on purpose:
    // that selector forces `true` for a solo participant (participantCount ===
    // 1) and other overrides, so the pill would never collapse in a one-person
    // meeting. The raw flag tracks the actual show/hide of the bar, which is
    // the cue web collapses on too.
    const toolboxVisible = useSelector((state: IReduxState) => state['features/toolbox'].visible);

    const collapsed = !toolboxVisible;
    const opacity = useRef(new Animated.Value(1)).current;

    // Fade out then in on a collapse/expand so the swap between the full pill
    // and the disk-only chip reads as a morph rather than a hard cut.
    useEffect(() => {
        opacity.setValue(0);
        Animated.timing(opacity, {
            duration: COLLAPSE_DURATION / 2,
            toValue: 1,
            useNativeDriver: true
        }).start();
    }, [ collapsed, opacity ]);

    if (!timerEnabled || !timerState.running) {
        return null;
    }

    const { elapsedSeconds, fillColor, fraction, overrunArcEndDeg, warning } = getTimerVisualState(timerState);
    const { expired } = timerState;
    const scheduled = getLocalizedDurationFormatter(timerState.durationSeconds * 1000);
    const elapsed = getLocalizedDurationFormatter(elapsedSeconds * 1000);

    // State-driven segment/text colours — expired wins over warning (more
    // urgent); in practice they're mutually exclusive.
    let scheduledSegmentBg = NAME_SEGMENT_BG;
    let timerSegmentBg = TIMER_SEGMENT_BG;
    let elapsedColor = REMAINING_TEXT_COLOR;

    if (expired) {
        scheduledSegmentBg = EXPIRED_NAME_SEGMENT_BG;
        timerSegmentBg = EXPIRED_TIMER_SEGMENT_BG;
        elapsedColor = EXPIRED_PILL_TEXT_COLOR;
    } else if (warning) {
        scheduledSegmentBg = WARNING_NAME_SEGMENT_BG;
        timerSegmentBg = WARNING_TIMER_SEGMENT_BG;
        elapsedColor = WARNING_COLOR;
    }

    const disk = (
        <Disk
            color = { fillColor }
            fraction = { fraction }
            overrunArcEndDeg = { overrunArcEndDeg }
            size = { DISK_SIZE } />
    );

    // Collapsed: just the disk in a fully-rounded chip (web's retracted state).
    if (collapsed) {
        return (
            <Animated.View
                style = { [ styles.collapsedChip, { backgroundColor: timerSegmentBg, opacity } ] }>
                { disk }
            </Animated.View>
        );
    }

    return (
        <Animated.View style = { [ styles.container, { opacity } ] }>
            <View style = { [ styles.scheduledSegment, { backgroundColor: scheduledSegmentBg } ] }>
                <Text style = { styles.scheduled }>({ scheduled })</Text>
            </View>
            <View style = { [ styles.timerSegment, { backgroundColor: timerSegmentBg } ] }>
                <Text style = { [ styles.elapsed, { color: elapsedColor } ] }>
                    { elapsed }
                </Text>
                { disk }
            </View>
        </Animated.View>
    );
};

export default TimeTimerLabel;
