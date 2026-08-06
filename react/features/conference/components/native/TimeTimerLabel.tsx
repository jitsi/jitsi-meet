import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle, View, ViewStyle } from 'react-native';
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

import styles, { TIME_TIMER_COLLAPSE_DURATION, TIME_TIMER_DISK } from './styles';

/**
 * Native port of web's two-segment time-timer pill, sized to align with the
 * Record/Transcribe labels. The left segment shows the scheduled duration, the
 * right the elapsed time + a progress {@code Disk}. All colours (blue baseline
 * / amber warning / red expired) come from the shared {@code getTimerVisualState}
 * so behaviour matches desktop. When the toolbox hides, the pill retracts to a
 * disk-only chip, cross-faded to read as a morph.
 *
 * @returns {ReactElement|null}
 */
const TimeTimerLabel = () => {
    const timerState = useSelector((state: IReduxState) => state['features/time-timer']);
    const timerEnabled = useSelector(isTimeTimerEnabled);

    // Read the RAW toolbox `visible` flag, not the isToolboxVisible selector:
    // that selector forces `true` for a solo participant, so the pill would
    // never collapse in a one-person meeting. The raw flag tracks the actual
    // show/hide of the bar — the cue web collapses on too.
    const toolboxVisible = useSelector((state: IReduxState) => state['features/toolbox'].visible);

    const collapsed = !toolboxVisible;
    const opacity = useRef(new Animated.Value(1)).current;

    // Fade out then in on collapse/expand so the swap between the full pill and
    // the disk-only chip reads as a morph rather than a hard cut.
    useEffect(() => {
        opacity.setValue(0);
        Animated.timing(opacity, {
            duration: TIME_TIMER_COLLAPSE_DURATION / 2,
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

    // State-driven segment/text colours — expired wins over warning (they are
    // mutually exclusive in practice).
    let scheduledSegmentBg = BaseTheme.palette.timeTimerNameSegmentBackground;
    let timerSegmentBg = BaseTheme.palette.timeTimerTimerSegmentBackground;
    let elapsedColor = BaseTheme.palette.timeTimerElapsedText;

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
            size = { TIME_TIMER_DISK } />
    );

    // Collapsed: just the disk in a fully-rounded chip (web's retracted state).
    if (collapsed) {
        return (
            <Animated.View
                style = { [ styles.timeTimerCollapsedChip as ViewStyle, { backgroundColor: timerSegmentBg, opacity } ] }>
                { disk }
            </Animated.View>
        );
    }

    return (
        <Animated.View style = { [ styles.timeTimerContainer as ViewStyle, { opacity } ] }>
            <View style = { [ styles.timeTimerScheduledSegment as ViewStyle, { backgroundColor: scheduledSegmentBg } ] }>
                <Text style = { styles.timeTimerScheduledText as TextStyle }>({ scheduled })</Text>
            </View>
            <View style = { [ styles.timeTimerTimerSegment as ViewStyle, { backgroundColor: timerSegmentBg } ] }>
                <Text style = { [ styles.timeTimerElapsedText as TextStyle, { color: elapsedColor } ] }>
                    { elapsed }
                </Text>
                { disk }
            </View>
        </Animated.View>
    );
};

export default TimeTimerLabel;
