// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import { ACTION_TRIGGER } from '../../../participants-pane/constants';
import participantsPaneTheme from '../themes/participantsPaneTheme.json';

type Props = {

    /**
     * List item actions.
     */
    actions: React$Node,

    /**
     * Icon to be displayed on the list item. (Avatar for participants)
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
     * Mouse leave handler.
     */
    onMouseLeave: Function,

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
    icon,
    id,
    hideActions = false,
    indicators,
    isHighlighted,
    onClick,
    onMouseLeave,
    textChildren,
    trigger
}: Props) => {
    const styles = useStyles();

    return (
        <div
            className = { `list-item-container ${styles.container} ${isHighlighted ? styles.highlighted : ''}` }
            id = { id }
            onClick = { onClick }
            onMouseLeave = { onMouseLeave }>
            <div> {icon} </div>
            <div className = { styles.detailsContainer }>
                <div className = { styles.name }>
                    {textChildren}
                </div>
                {indicators && (
                    <div
                        className = { `indicators ${styles.indicators} ${
                            isHighlighted || trigger === ACTION_TRIGGER.PERMANENT
                                ? styles.indicatorsHidden : ''}` }>
                        {indicators}
                    </div>
                )}
                {!hideActions && (
                    <div
                        className = { `actions ${styles.actionsContainer} ${
                            trigger === ACTION_TRIGGER.PERMANENT ? styles.actionsPermanent : ''} ${
                            isHighlighted ? styles.actionsVisible : ''}` }>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListItem;
