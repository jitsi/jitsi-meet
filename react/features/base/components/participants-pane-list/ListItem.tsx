import React, { ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';

import { ACTION_TRIGGER } from '../../../participants-pane/constants';
import { isMobileBrowser } from '../../environment/utils';
import { withPixelLineHeight } from '../../styles/functions.web';
import participantsPaneTheme from '../themes/participantsPaneTheme.json';

interface IProps {

    /**
     * List item actions.
     */
    actions: ReactNode;

    /**
     * List item container class name.
     */
    className?: string;

    /**
     * Whether or not the actions should be hidden.
     */
    hideActions?: boolean;

    /**
     * Icon to be displayed on the list item. (Avatar for participants).
     */
    icon: ReactNode;

    /**
     * Id of the container.
     */
    id?: string;

    /**
     * Indicators to be displayed on the list item.
     */
    indicators?: ReactNode;

    /**
     * Whether or not the item is highlighted.
     */
    isHighlighted?: boolean;

    /**
     * Click handler.
     */
    onClick?: (e?: React.MouseEvent) => void;

    /**
     * Long press handler.
     */
    onLongPress?: (e?: EventTarget) => void;

    /**
     * Mouse leave handler.
     */
    onMouseLeave?: (e?: React.MouseEvent) => void;

    /**
     * Data test id.
     */
    testId?: string;

    /**
     * Text children to be displayed on the list item.
     */
    textChildren: ReactNode | string;

    /**
     * The actions trigger. Can be Hover or Permanent.
     */
    trigger: string;

}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            alignItems: 'center',
            color: theme.palette.text01,
            display: 'flex',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            margin: `0 -${participantsPaneTheme.panePadding}px`,
            padding: `0 ${participantsPaneTheme.panePadding}px`,
            position: 'relative',
            boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)',
            minHeight: '40px',

            '&:hover': {
                backgroundColor: theme.palette.ui02,

                '& .indicators': {
                    display: 'none'
                },

                '& .actions': {
                    display: 'flex',
                    boxShadow: `-15px 0px 10px -5px ${theme.palette.ui02}`,
                    backgroundColor: theme.palette.ui02
                }
            },

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),
                padding: `${theme.spacing(2)} ${participantsPaneTheme.panePadding}px`
            }
        },

        highlighted: {
            backgroundColor: theme.palette.ui02
        },

        detailsContainer: {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
        },

        name: {
            display: 'flex',
            flex: 1,
            marginRight: theme.spacing(2),
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'flex-start'
        },

        indicators: {
            display: 'flex',
            justifyContent: 'flex-end',

            '& > *': {
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center'
            },

            '& > *:not(:last-child)': {
                marginRight: theme.spacing(2)
            },

            '& .jitsi-icon': {
                padding: '3px'
            }
        },

        indicatorsHidden: {
            display: 'none'
        },

        actionsContainer: {
            display: 'none',
            boxShadow: `-15px 0px 10px -5px ${theme.palette.ui02}`,
            backgroundColor: theme.palette.ui02
        },

        actionsPermanent: {
            display: 'flex',
            boxShadow: `-15px 0px 10px -5px ${theme.palette.ui01}`,
            backgroundColor: theme.palette.ui01
        },

        actionsVisible: {
            display: 'flex',
            boxShadow: `-15px 0px 10px -5px ${theme.palette.ui02}`,
            backgroundColor: theme.palette.ui02
        }
    };
});

const ListItem = ({
    actions,
    className,
    icon,
    id,
    hideActions = false,
    indicators,
    isHighlighted,
    onClick,
    onLongPress,
    onMouseLeave,
    testId,
    textChildren,
    trigger
}: IProps) => {
    const { classes: styles, cx } = useStyles();
    const _isMobile = isMobileBrowser();
    let timeoutHandler: number;

    /**
     * Set calling long press handler after x milliseconds.
     *
     * @param {TouchEvent} e - Touch start event.
     * @returns {void}
     */
    function _onTouchStart(e: React.TouchEvent) {
        const target = e.touches[0].target;

        timeoutHandler = window.setTimeout(() => onLongPress?.(target), 600);
    }

    /**
     * Cancel calling on long press after x milliseconds if the number of milliseconds is not reached
     * before a touch move(drag), or just clears the timeout.
     *
     * @returns {void}
     */
    function _onTouchMove() {
        clearTimeout(timeoutHandler);
    }

    /**
     * Cancel calling on long press after x milliseconds if the number of milliseconds is not reached yet,
     * or just clears the timeout.
     *
     * @returns {void}
     */
    function _onTouchEnd() {
        clearTimeout(timeoutHandler);
    }

    return (
        <div
            className = { cx('list-item-container',
                styles.container,
                isHighlighted && styles.highlighted,
                className
            ) }
            data-testid = { testId }
            id = { id }
            onClick = { onClick }
            { ...(_isMobile
                ? {
                    onTouchEnd: _onTouchEnd,
                    onTouchMove: _onTouchMove,
                    onTouchStart: _onTouchStart
                }
                : {
                    onMouseLeave
                }
            ) }>
            <div> {icon} </div>
            <div className = { styles.detailsContainer }>
                <div className = { styles.name }>
                    {textChildren}
                </div>
                {indicators && (
                    <div
                        className = { cx('indicators',
                            styles.indicators,
                            (isHighlighted || trigger === ACTION_TRIGGER.PERMANENT) && styles.indicatorsHidden
                        ) }>
                        {indicators}
                    </div>
                )}
                {!hideActions && (
                    <div
                        className = { cx('actions',
                            styles.actionsContainer,
                            trigger === ACTION_TRIGGER.PERMANENT && styles.actionsPermanent,
                            isHighlighted && styles.actionsVisible
                        ) }>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListItem;
