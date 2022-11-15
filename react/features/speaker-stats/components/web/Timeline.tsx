import React, { MouseEvent, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getConferenceTimestamp } from '../../../base/conference/functions';
import { FaceLandmarks } from '../../../face-landmarks/types';
import { addToOffset, setTimelinePanning } from '../../actions.any';
import { SCROLL_RATE, TIMELINE_COLORS } from '../../constants';
import { getFaceLandmarksEnd, getFaceLandmarksStart, getTimelineBoundaries } from '../../functions';

type Props = {
    faceLandmarks?: FaceLandmarks[];
};

const Timeline = ({ faceLandmarks }: Props) => {
    const startTimestamp = useSelector((state: IReduxState) => getConferenceTimestamp(state)) ?? 0;
    const { left, right } = useSelector((state: IReduxState) => getTimelineBoundaries(state));
    const { timelinePanning } = useSelector((state: IReduxState) => state['features/speaker-stats']);
    const dispatch = useDispatch();
    const containerRef = useRef<HTMLDivElement>(null);
    const intervalDuration = right - left;

    const getSegments = () => {
        const segments = faceLandmarks?.filter(landmarks => {
            const timeStart = getFaceLandmarksStart(landmarks, startTimestamp);
            const timeEnd = getFaceLandmarksEnd(landmarks, startTimestamp);

            if (timeEnd > left && timeStart < right) {

                return true;
            }

            return false;
        }) ?? [];

        let leftCut;
        let rightCut;

        if (segments.length) {
            const start = getFaceLandmarksStart(segments[0], startTimestamp);
            const end = getFaceLandmarksEnd(segments[segments.length - 1], startTimestamp);

            if (start <= left) {
                leftCut = segments[0];
            }
            if (end >= right) {
                rightCut = segments[segments.length - 1];
            }
        }

        if (leftCut) {
            segments.shift();
        }
        if (rightCut) {
            segments.pop();
        }

        return {
            segments,
            leftCut,
            rightCut
        };
    };

    const { segments, leftCut, rightCut } = getSegments();

    const getStyle = (duration: number, faceExpression: string) => {
        return {
            width: `${100 / (intervalDuration / duration)}%`,
            backgroundColor: TIMELINE_COLORS[faceExpression] ?? '#FFFFFF00'
        };
    };


    const getStartStyle = () => {
        let startDuration = 0;
        let color = '#FFFFFF00';

        if (leftCut) {
            const { faceExpression } = leftCut;

            startDuration = getFaceLandmarksEnd(leftCut, startTimestamp) - left;
            color = TIMELINE_COLORS[faceExpression];
        } else if (segments.length) {
            startDuration = getFaceLandmarksStart(segments[0], startTimestamp) - left;
        } else if (rightCut) {
            startDuration = getFaceLandmarksStart(rightCut, startTimestamp) - left;
        }

        return {
            width: `${100 / (intervalDuration / startDuration)}%`,
            backgroundColor: color
        };
    };

    const getEndStyle = () => {
        let endDuration = 0;
        let color = '#FFFFFF00';

        if (rightCut) {
            const { faceExpression } = rightCut;

            endDuration = right - getFaceLandmarksStart(rightCut, startTimestamp);
            color = TIMELINE_COLORS[faceExpression];
        } else if (segments.length) {
            endDuration = right - getFaceLandmarksEnd(segments[segments.length - 1], startTimestamp);
        } else if (leftCut) {
            endDuration = right - getFaceLandmarksEnd(leftCut, startTimestamp);
        }

        return {
            width: `${100 / (intervalDuration / endDuration)}%`,
            backgroundColor: color
        };
    };

    const getOneSegmentStyle = (faceExpression?: string) => {
        return {
            width: '100%',
            backgroundColor: faceExpression ? TIMELINE_COLORS[faceExpression] : '#FFFFFF00',
            borderRadius: 0
        };
    };

    const handleOnWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
            const value = event.deltaX * SCROLL_RATE;

            dispatch(addToOffset(value));
            event.preventDefault();
        }
    };

    const hideStartAndEndSegments = () => leftCut && rightCut
                    && leftCut.faceExpression === rightCut.faceExpression && !segments.length;

    useEffect(() => {
        containerRef.current?.addEventListener('wheel', handleOnWheel, { passive: false });

        return () => containerRef.current?.removeEventListener('wheel', handleOnWheel);
    }, []);

    const getPointOnTimeline = (event: MouseEvent) => {
        const axisRect = event.currentTarget.getBoundingClientRect();
        const eventOffsetX = event.pageX - axisRect.left;

        return (eventOffsetX * right) / axisRect.width;
    };


    const handleOnMouseMove = (event: MouseEvent) => {
        const { active, x } = timelinePanning;

        if (active) {
            const point = getPointOnTimeline(event);

            dispatch(addToOffset(x - point));
            dispatch(setTimelinePanning({ ...timelinePanning,
                x: point }));
        }
    };

    const handleOnMouseDown = (event: MouseEvent) => {
        const point = getPointOnTimeline(event);

        dispatch(setTimelinePanning(
                {
                    active: true,
                    x: point
                }
        ));

        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div
            className = 'timeline-container'
            // eslint-disable-next-line react/jsx-no-bind
            onMouseDown = { handleOnMouseDown }
            // eslint-disable-next-line react/jsx-no-bind
            onMouseMove = { handleOnMouseMove }
            ref = { containerRef }>
            <div
                className = 'timeline'>
                {!hideStartAndEndSegments() && <div
                    area-label = 'start'
                    style = { getStartStyle() } />}
                {hideStartAndEndSegments() && <div
                    style = { getOneSegmentStyle(leftCut?.faceExpression) } />}
                {segments?.map(({ duration, timestamp, faceExpression }) =>
                    (<div
                        area-label = { faceExpression }
                        key = { timestamp }
                        style = { getStyle(duration, faceExpression) } />)) }

                {!hideStartAndEndSegments() && <div
                    area-label = 'end'
                    style = { getEndStyle() } />}
            </div>
        </div>
    );
};

export default Timeline;
