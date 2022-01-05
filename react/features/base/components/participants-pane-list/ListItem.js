// @flow

import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React from 'react';

import { ACTION_TRIGGER } from '../../../participants-pane/constants';
import { isMobileBrowser } from '../../environment/utils';
import participantsPaneTheme from '../themes/participantsPaneTheme.json';

type Props = {

    /**
     * List item actions.
     */
    actions: React$Node,

    /**
     * List item container class name.
     */
    className: string,

    /**
     * Icon to be displayed on the list item. (Avatar for participants).
     */
    icon: React$Node,

    /**
     * Id of the container.
     */
    id: string,

    /**
     * Whether or not the actions should be hidden.
     */
    hideActions?: Boolean,

    /**
     * Indicators to be displayed on the list item.
     */
    indicators?: React$Node,

    /**
     * Whether or not the item is highlighted.
     */
    isHighlighted?: boolean,

    /**
     * Click handler.
     */
    onClick: Function,

    /**
     * Long press handler.
     */
    onLongPress: Function,

    /**
     * Mouse leave handler.
     */
    onMouseLeave: Function,

    /**
     * Data test id.
     */
    testId?: string,

    /**
     * Text children to be displayed on the list item.
     */
    textChildren: React$Node | string,

    /**
     * The actions trigger. Can be Hover or Permanent.
     */
    trigger: string

}

const useStyles = makeStyles(theme => {
    return {
        container: {
            alignItems: 'center',
            color: theme.palette.text01,
            display: 'flex',
            ...theme.typography.bodyShortRegular,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeight}px`,
            margin: `0 -${participantsPaneTheme.panePadding}px`,
            padding: `0 ${participantsPaneTheme.panePadding}px`,
            position: 'relative',
            boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)',
            minHeight: '40px',

            '&:hover': {
                backgroundColor: theme.palette.action02Active,

                '& .indicators': {
                    display: 'none'
                },

                '& .actions': {
                    display: 'flex',
                    boxShadow: `-15px 0px 10px -5px ${theme.palette.action02Active}`,
                    backgroundColor: theme.palette.action02Active
                }
            },

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...theme.typography.bodyShortRegularLarge,
                lineHeight: `${theme.typography.bodyShortRegularLarge.lineHeight}px`,
                padding: `${theme.spacing(2)}px ${participantsPaneTheme.panePadding}px`
            }
        },

        highlighted: {
            backgroundColor: theme.palette.action02Active
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
            marginRight: `${theme.spacing(2)}px`,
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
                marginRight: `${theme.spacing(2)}px`
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
            boxShadow: `-15px 0px 10px -5px ${theme.palette.action02Active}`,
            backgroundColor: theme.palette.action02Active
        },

        actionsPermanent: {
            display: 'flex',
            boxShadow: `-15px 0px 10px -5px ${theme.palette.ui01}`,
            backgroundColor: theme.palette.ui01
        },

        actionsVisible: {
            display: 'flex',
            boxShadow: `-15px 0px 10px -5px ${theme.palette.action02Active}`,
            backgroundColor: theme.palette.action02Active
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
}: Props) => {
    const styles = useStyles();
    const _isMobile = isMobileBrowser();
    let timeoutHandler;

    /**
     * Set calling long press handler after x milliseconds.
     *
     * @param {TouchEvent} e - Touch start event.
     * @returns {void}
     */
    function _onTouchStart(e) {
        const target = e.touches[0].target;

        timeoutHandler = setTimeout(() => onLongPress(target), 600);
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
            className = { clsx('list-item-container',
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
                        className = { clsx('indicators',
                            styles.indicators,
                            (isHighlighted || trigger === ACTION_TRIGGER.PERMANENT) && styles.indicatorsHidden
                        ) }>
                        {indicators}
                    </div>
                )}
                {!hideActions && (
                    <div
                        className = { clsx('actions',
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
