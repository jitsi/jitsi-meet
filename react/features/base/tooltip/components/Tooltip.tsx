import React, { ReactElement, cloneElement, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../environment/utils';
import Popover from '../../popover/components/Popover.web';
import { TOOLTIP_POSITION } from '../../ui/constants.any';
import { hideTooltip, showTooltip } from '../actions';

const TOOLTIP_DELAY = 300;
const ANIMATION_DURATION = 0.2;

interface IProps {
    children: ReactElement;
    containerClassName?: string;
    content: string | ReactElement;
    position?: TOOLTIP_POSITION;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            backgroundColor: theme.palette.uiBackground,
            borderRadius: '3px',
            padding: theme.spacing(2),
            ...theme.typography.labelRegular,
            color: theme.palette.text01,
            position: 'relative',

            '&.mounting-animation': {
                animation: `${keyframes`
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                `} ${ANIMATION_DURATION}s forwards ease-in`
            },

            '&.unmounting': {
                animation: `${keyframes`
                    0% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                `} ${ANIMATION_DURATION}s forwards ease-out`
            }
        }
    };
});

const Tooltip = ({ containerClassName, content, children, position = 'top' }: IProps) => {
    const dispatch = useDispatch();
    const [ visible, setVisible ] = useState(false);
    const [ isUnmounting, setIsUnmounting ] = useState(false);
    const [ wasOpenedWithKeyboard, setWasOpenedWithKeyboard ] = useState(false);
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const { classes, cx } = useStyles();
    const timeoutID = useRef({
        open: 0,
        close: 0
    });
    const tooltipId = useRef(`tooltip-${Math.random().toString(36).substring(2, 11)}`);
    const {
        content: storeContent,
        previousContent,
        visible: isVisible
    } = useSelector((state: IReduxState) => state['features/base/tooltip']);

    const contentComponent = (
        <div
            className = { cx(classes.container, previousContent === '' && 'mounting-animation',
                isUnmounting && 'unmounting') }
            id = { tooltipId.current }
            role = 'tooltip'
            tabIndex = { wasOpenedWithKeyboard ? 0 : -1 }>
            {content}
        </div>
    );

    const openPopover = () => {
        setVisible(true);
        dispatch(showTooltip(content));
    };

    const closePopover = () => {
        setVisible(false);
        dispatch(hideTooltip(content));
        setIsUnmounting(false);
    };

    const onPopoverOpen = useCallback((keyboardTriggered = false) => {
        if (isUnmounting) {
            return;
        }

        setWasOpenedWithKeyboard(keyboardTriggered);
        clearTimeout(timeoutID.current.close);
        timeoutID.current.close = 0;
        if (!visible) {
            if (isVisible) {
                openPopover();
            } else {
                const delay = keyboardTriggered ? 0 : TOOLTIP_DELAY;

                timeoutID.current.open = window.setTimeout(() => {
                    openPopover();
                }, delay);
            }
        }
    }, [ visible, isVisible, isUnmounting ]);

    const onPopoverClose = useCallback((immediate = false) => {
        clearTimeout(timeoutID.current.open);
        if (visible) {
            const delay = immediate ? 0 : TOOLTIP_DELAY;

            timeoutID.current.close = window.setTimeout(() => {
                setIsUnmounting(true);
            }, delay);
        }
        setWasOpenedWithKeyboard(false);
    }, [ visible ]);

    useEffect(() => {
        if (isUnmounting) {
            setTimeout(() => {
                if (timeoutID.current.close !== 0) {
                    closePopover();
                }
            }, (ANIMATION_DURATION * 1000) + 10);
        }
    }, [ isUnmounting ]);

    useEffect(() => {
        if (storeContent !== content) {
            closePopover();
            clearTimeout(timeoutID.current.close);
            timeoutID.current.close = 0;
        }
    }, [ storeContent, content ]);

    const handleFocus = useCallback(() => {
        onPopoverOpen(true);
    }, [ onPopoverOpen ]);

    const handleBlur = useCallback(() => {
        onPopoverClose(true);
    }, [ onPopoverClose ]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && visible) {
            event.preventDefault();
            onPopoverClose(true);
        }
    }, [ visible, onPopoverClose ]);

    if (isMobileBrowser() || overflowDrawer) {
        return children;
    }

    const enhancedChildren = cloneElement(children, {
        'aria-describedby': visible ? tooltipId.current : undefined,
        tabIndex: children.props.tabIndex !== undefined ? children.props.tabIndex : 0,
        onFocus: (event: React.FocusEvent) => {
            handleFocus();
            if (children.props.onFocus) {
                children.props.onFocus(event);
            }
        },
        onBlur: (event: React.FocusEvent) => {
            handleBlur();
            if (children.props.onBlur) {
                children.props.onBlur(event);
            }
        },
        onKeyDown: (event: React.KeyboardEvent) => {
            handleKeyDown(event);
            if (children.props.onKeyDown) {
                children.props.onKeyDown(event);
            }
        }
    });

    return (
        <Popover
            allowClick = { true }
            className = { containerClassName }
            content = { contentComponent }
            focusable = { false }
            onPopoverClose = { onPopoverClose }
            onPopoverOpen = { onPopoverOpen }
            position = { position }
            role = 'tooltip'
            visible = { visible }>
            {enhancedChildren}
        </Popover>
    );
};

export default Tooltip;
