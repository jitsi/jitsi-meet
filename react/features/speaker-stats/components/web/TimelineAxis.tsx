import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { addToOffset, addToOffsetLeft, addToOffsetRight, setTimelinePanning } from '../../actions.any';
import { MIN_HANDLER_WIDTH } from '../../constants';
import { getCurrentDuration, getTimelineBoundaries } from '../../functions';

import TimeElapsed from './TimeElapsed';

const TimelineAxis = () => {
    const currentDuration = useSelector((state: IReduxState) => getCurrentDuration(state)) ?? 0;
    const { left, right } = useSelector((state: IReduxState) => getTimelineBoundaries(state));
    const { timelinePanning } = useSelector((state: IReduxState) => state['features/speaker-stats']);
    const dispatch = useDispatch();
    const axisRef = useRef<HTMLDivElement>(null);

    const [ dragLeft, setDragLeft ] = useState(false);
    const [ dragRight, setDragRight ] = useState(false);

    const getPointOnAxis = useCallback((event: MouseEvent) => {
        const axisRect = event.currentTarget.getBoundingClientRect();
        const eventOffsetX = event.pageX - axisRect.left;

        return (eventOffsetX * currentDuration) / axisRect.width;
    }, [ currentDuration ]);

    const startResizeHandlerLeft = useCallback((event: MouseEvent) => {
        if (!timelinePanning.active && !dragRight) {
            setDragLeft(true);
        }
        event.preventDefault();
        event.stopPropagation();
    }, [ dragRight, timelinePanning, setDragLeft ]);

    const stopResizeLeft = () => {
        setDragLeft(false);
    };

    const resizeHandlerLeft = useCallback((event: MouseEvent) => {
        if (dragLeft) {
            const point = getPointOnAxis(event);

            if (point >= 0 && point < right) {
                const value = point - left;

                dispatch(addToOffsetLeft(value));
            }
        }
    }, [ dragLeft, getPointOnAxis, dispatch, addToOffsetLeft ]);

    const startResizeHandlerRight = useCallback((event: MouseEvent) => {
        if (!timelinePanning.active && !dragRight) {
            setDragRight(true);
        }
        event.preventDefault();
        event.stopPropagation();
    }, [ timelinePanning, dragRight ]);

    const stopResizeRight = useCallback(() => {
        setDragRight(false);
    }, [ setDragRight ]);

    const resizeHandlerRight = (event: MouseEvent) => {
        if (dragRight) {
            const point = getPointOnAxis(event);

            if (point > left && point <= currentDuration) {
                const value = point - right;

                dispatch(addToOffsetRight(value));
            }
        }
    };

    const startMoveHandler = useCallback((event: MouseEvent) => {
        if (!dragLeft && !dragRight) {
            const point = getPointOnAxis(event);

            dispatch(setTimelinePanning(
                {
                    active: true,
                    x: point
                }
            ));
        }
        event.preventDefault();
        event.stopPropagation();
    }, [ dragLeft, dragRight, getPointOnAxis, dispatch, setTimelinePanning ]);

    const stopMoveHandler = () => {
        dispatch(setTimelinePanning({ ...timelinePanning,
            active: false }));
    };

    const moveHandler = useCallback((event: MouseEvent) => {
        const { active, x } = timelinePanning;

        if (active) {
            const point = getPointOnAxis(event);

            dispatch(addToOffset(point - x));
            dispatch(setTimelinePanning({ ...timelinePanning,
                x: point }));
        }
    }, [ timelinePanning, getPointOnAxis, dispatch, addToOffset, setTimelinePanning ]);

    const handleOnMouseMove = useCallback((event: MouseEvent) => {
        resizeHandlerLeft(event);
        resizeHandlerRight(event);
        moveHandler(event);
    }, [ resizeHandlerLeft, resizeHandlerRight ]);

    const handleOnMouseUp = useCallback(() => {
        stopResizeLeft();
        stopResizeRight();
        stopMoveHandler();
    }, [ stopResizeLeft, stopResizeRight, stopMoveHandler ]);

    const getHandlerStyle = useCallback(() => {
        let marginLeft = 100 / (currentDuration / left);
        let width = 100 / (currentDuration / (right - left));

        if (axisRef.current) {
            const axisWidth = axisRef.current.getBoundingClientRect().width;
            let handlerWidth = (width / 100) * axisWidth;

            if (handlerWidth < MIN_HANDLER_WIDTH) {
                const newLeft = right - ((currentDuration * MIN_HANDLER_WIDTH) / axisWidth);

                handlerWidth = MIN_HANDLER_WIDTH;
                marginLeft = 100 / (currentDuration / newLeft);
                width = 100 / (currentDuration / (right - newLeft));
            }

            if (marginLeft + width > 100) {
                return {
                    marginLeft: `calc(100% - ${handlerWidth}px)`,
                    width: handlerWidth
                };
            }
        }

        return {
            marginLeft: `${marginLeft > 0 ? marginLeft : 0}%`,
            width: `${width}%`
        };
    }, [ currentDuration, left, right, axisRef ]);

    useEffect(() => {
        window.addEventListener('mouseup', handleOnMouseUp);

        return () => window.removeEventListener('mouseup', handleOnMouseUp);
    }, []);

    return (
        <div
            className = 'axis-container'
            onMouseMove = { handleOnMouseMove }
            ref = { axisRef }>
            <div
                className = 'axis'>
                <div className = 'left-bound'>
                    <TimeElapsed time = { 0 } />
                </div>
                <div className = 'right-bound'>
                    <TimeElapsed time = { currentDuration } />
                </div>
                <div
                    className = 'handler'
                    onMouseDown = { startMoveHandler }
                    style = { getHandlerStyle() } >
                    <div
                        className = 'resize'
                        id = 'left'
                        onMouseDown = { startResizeHandlerLeft } />
                    <div
                        className = 'resize'
                        id = 'right'
                        onMouseDown = { startResizeHandlerRight } />
                </div>
            </div>
        </div>
    );
};

export default TimelineAxis;
