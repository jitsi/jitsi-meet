import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalizedDurationFormatter } from '../../../base/i18n/dateUtil';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Disk from '../../../time-timer/components/native/Disk';
import { getTimerVisualState, isTimeTimerEnabled } from '../../../time-timer/functions';

import styles, { TIME_TIMER_COLLAPSE_DURATION, TIME_TIMER_DISK } from './styles';

/**
 * Native two-segment time-timer pill: scheduled duration | elapsed + a progress
 * {@code Disk}. Colours come from the shared {@code getTimerVisualState}. When
 * the toolbox hides, it retracts to a disk-only chip.
 *
 * @returns {ReactElement|null}
 */
const TimeTimerLabel = () => {
    const timerState = useSelector((state: IReduxState) => state['features/time-timer']);
    const timerEnabled = useSelector(isTimeTimerEnabled);

    // Raw `visible` flag, not isToolboxVisible — that selector forces true for
    // a solo participant, which would stop the pill collapsing when alone.
    const toolboxVisible = useSelector((state: IReduxState) => state['features/toolbox'].visible);

    const collapsed = !toolboxVisible;
    const opacity = useRef(new Animated.Value(1)).current;

    // Fade out then in on collapse/expand so the swap reads as a morph.
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

    // Expired wins over warning.
    let scheduledSegmentBg = BaseTheme.palette.timeTimerNameSegmentBackground;
    let timerSegmentBg = BaseTheme.palette.timeTimerTimerSegmentBackground;
    let elapsedColor = BaseTheme.palette.timeTimerElapsedText;

    if (expired) {
        scheduledSegmentBg = BaseTheme.palette.timeTimerExpiredNameSegmentBackground;
        timerSegmentBg = BaseTheme.palette.timeTimerExpiredTimerSegmentBackground;
        elapsedColor = BaseTheme.palette.timeTimerExpiredText;
    } else if (warning) {
        scheduledSegmentBg = BaseTheme.palette.timeTimerWarningNameSegmentBackground;
        timerSegmentBg = BaseTheme.palette.timeTimerWarningTimerSegmentBackground;
        elapsedColor = BaseTheme.palette.timeTimerWarning;
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
