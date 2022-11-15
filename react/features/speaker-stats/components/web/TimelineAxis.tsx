import React, { MouseEvent, useEffect, useRef, useState } from 'react';
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

    const getPointOnAxis = (event: MouseEvent) => {
        const axisRect = event.currentTarget.getBoundingClientRect();
        const eventOffsetX = event.pageX - axisRect.left;

        return (eventOffsetX * currentDuration) / axisRect.width;
    };

    const startResizeHandlerLeft = (event: MouseEvent) => {
        if (!timelinePanning.active && !dragRight) {
            setDragLeft(true);
        }
        event.preventDefault();
        event.stopPropagation();
    };

    const stopResizeLeft = () => {
        setDragLeft(false);

    };

    const resizeHandlerLeft = (event: MouseEvent) => {
        if (dragLeft) {
            const point = getPointOnAxis(event);

            if (point >= 0 && point < right) {
                const value = point - left;

                dispatch(addToOffsetLeft(value));
            }

        }
    };

    const startResizeHandlerRight = (event: MouseEvent) => {
        if (!timelinePanning.active && !dragRight) {
            setDragRight(true);
        }
        event.preventDefault();
        event.stopPropagation();
    };

    const stopResizeRight = () => {
        setDragRight(false);

    };

    const resizeHandlerRight = (event: MouseEvent) => {
        if (dragRight) {
            const point = getPointOnAxis(event);

            if (point > left && point <= currentDuration) {
                const value = point - right;

                dispatch(addToOffsetRight(value));
            }

        }
    };

    const startMoveHandler = (event: MouseEvent) => {
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
    };

    const stopMoveHandler = () => {
        dispatch(setTimelinePanning({ ...timelinePanning,
            active: false }));

    };

    const moveHandler = (event: MouseEvent) => {
        const { active, x } = timelinePanning;

        if (active) {
            const point = getPointOnAxis(event);

            dispatch(addToOffset(point - x));
            dispatch(setTimelinePanning({ ...timelinePanning,
                x: point }));
        }
    };

    const handleOnMouseMove = (event: MouseEvent) => {
        resizeHandlerLeft(event);
        resizeHandlerRight(event);
        moveHandler(event);
    };

    const handleOnMouseUp = () => {
        stopResizeLeft();
        stopResizeRight();
        stopMoveHandler();
    };

    const getHandlerStyle = () => {
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
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleOnMouseUp);

        return () => window.removeEventListener('mouseup', handleOnMouseUp);
    }, []);

    return (
        <div
            className = 'axis-container'
            // eslint-disable-next-line react/jsx-no-bind
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
                    // eslint-disable-next-line react/jsx-no-bind
                    onMouseDown = { startMoveHandler }
                    style = { getHandlerStyle() } >
                    <div
                        className = 'resize'
                        id = 'left'
                        // eslint-disable-next-line react/jsx-no-bind
                        onMouseDown = { startResizeHandlerLeft } />
                    <div
                        className = 'resize'
                        id = 'right'
                        // eslint-disable-next-line react/jsx-no-bind
                        onMouseDown = { startResizeHandlerRight } />
                </div>
            </div>
        </div>
    );
};

export default TimelineAxis;
