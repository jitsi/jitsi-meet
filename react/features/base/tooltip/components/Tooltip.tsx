import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../environment/utils';
import Popover from '../../popover/components/Popover.web';
import { withPixelLineHeight } from '../../styles/functions.web';
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
            ...withPixelLineHeight(theme.typography.labelRegular),
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
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const { classes, cx } = useStyles();
    const timeoutID = useRef({
        open: 0,
        close: 0
    });
    const {
        content: storeContent,
        previousContent,
        visible: isVisible
    } = useSelector((state: IReduxState) => state['features/base/tooltip']);

    const contentComponent = (
        <div
            className = { cx(classes.container, previousContent === '' && 'mounting-animation',
                isUnmounting && 'unmounting') }>
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

    const onPopoverOpen = useCallback(() => {
        if (isUnmounting) {
            return;
        }

        clearTimeout(timeoutID.current.close);
        timeoutID.current.close = 0;
        if (!visible) {
            if (isVisible) {
                openPopover();
            } else {
                timeoutID.current.open = window.setTimeout(() => {
                    openPopover();
                }, TOOLTIP_DELAY);
            }
        }
    }, [ visible, isVisible, isUnmounting ]);

    const onPopoverClose = useCallback(() => {
        clearTimeout(timeoutID.current.open);
        if (visible) {
            timeoutID.current.close = window.setTimeout(() => {
                setIsUnmounting(true);
            }, TOOLTIP_DELAY);
        }
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
    }, [ storeContent ]);


    if (isMobileBrowser() || overflowDrawer) {
        return children;
    }

    return (
        <Popover
            allowClick = { true }
            className = { containerClassName }
            content = { contentComponent }
            focusable = { false }
            onPopoverClose = { onPopoverClose }
            onPopoverOpen = { onPopoverOpen }
            position = { position }
            visible = { visible }>
            {children}
        </Popover>
    );
};

export default Tooltip;
