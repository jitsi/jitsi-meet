/* eslint-disable lines-around-comment */
import React, { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import Popover from '../../../base/popover/components/Popover.web';
// @ts-ignore
import { ReactionEmoji, ReactionsMenu } from '../../../reactions/components';
import { REACTIONS_MENU_HEIGHT } from '../../../reactions/constants';
import { getReactionsQueue } from '../../../reactions/functions.any';
import { DRAWER_MAX_HEIGHT } from '../../constants';

// @ts-ignore
import Drawer from './Drawer';
// @ts-ignore
import JitsiPortal from './JitsiPortal';
// @ts-ignore
import OverflowToggleButton from './OverflowToggleButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
interface IProps {

    /**
     * ID of the menu that is controlled by this button.
     */
    ariaControls: string;

    /**
     * A child React Element to display within {@code Popover}.
     */
    children: ReactNode;

    /**
     * Whether or not the OverflowMenu popover should display.
     */
    isOpen: boolean;

    /**
     * Callback to change the visibility of the overflow menu.
     */
    onVisibilityChange: Function;

    /**
     * Whether or not to display the reactions in the mobile menu.
     */
    showMobileReactions: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        overflowMenuDrawer: {
            overflowY: 'auto' as const,
            height: `calc(${DRAWER_MAX_HEIGHT} - ${REACTIONS_MENU_HEIGHT}px - 16px)`
        }
    };
});

const OverflowMenuButton = ({
    children,
    isOpen,
    onVisibilityChange,
    showMobileReactions
}: IProps) => {
    const { classes } = useStyles();
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const reactionsQueue = useSelector(getReactionsQueue);

    const onCloseDialog = useCallback(() => {
        onVisibilityChange(false);
    }, [ onVisibilityChange ]);

    const onOpenDialog = useCallback(() => {
        onVisibilityChange(true);
    }, [ onVisibilityChange ]);

    const onEscClick = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            onCloseDialog();
        }
    }, [ onCloseDialog ]);

    const toggleDialogVisibility = useCallback(() => {
        sendAnalytics(createToolbarEvent('overflow'));

        onVisibilityChange(!isOpen);
    }, [ isOpen, onVisibilityChange ]);

    return (
        <div className = 'toolbox-button-wth-dialog context-menu'>
            {
                overflowDrawer ? (
                    <>
                        <OverflowToggleButton
                            handleClick = { toggleDialogVisibility }
                            isOpen = { isOpen }
                            onKeyDown = { onEscClick } />
                        <JitsiPortal>
                            <Drawer
                                isOpen = { isOpen }
                                onClose = { onCloseDialog }>
                                <>
                                    <div className = { classes.overflowMenuDrawer }>
                                        {children}
                                    </div>
                                    {showMobileReactions && <ReactionsMenu overflowMenu = { true } />}
                                </>
                            </Drawer>
                            {showMobileReactions && <div className = 'reactions-animations-container'>
                                {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                                    index = { index }
                                    key = { uid }
                                    reaction = { reaction }
                                    uid = { uid } />))}
                            </div>}
                        </JitsiPortal>
                    </>
                ) : (
                    <Popover
                        content = { children }
                        onPopoverClose = { onCloseDialog }
                        onPopoverOpen = { onOpenDialog }
                        position = 'top'
                        trigger = 'click'
                        visible = { isOpen }>
                        <OverflowToggleButton
                            isOpen = { isOpen }
                            onKeyDown = { onEscClick } />
                    </Popover>
                )
            }
        </div>
    );
};

export default OverflowMenuButton;
