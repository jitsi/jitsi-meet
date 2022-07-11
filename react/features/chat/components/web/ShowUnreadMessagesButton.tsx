import React, { Component } from 'React';
import { makeStyles, Theme } from '@material-ui/core';
import { translate } from '../../../base/i18n';
import { Icon, IconArrowDown } from '../../../base/icons';


export interface IUnreadMessagesButton {
    unreadMessagesCounter: number;
    t: Function;
}

const useStyles = makeStyles((theme: any) => {
    return {
        container: {
            position: 'absolute',
            left: 'calc(50% - 174px/2 + 0.5px)',
            bottom: '80px'
        },

        arrowDownIconContainer: {
            height: '20px',
            width: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            '& svg': {
                fill: theme.palette?.uiBackground,
                transform: 'matrix(-1, 0, 0, 1, 0, 0);'
            }
        },
        unreadMessagesButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '174px',
            height: '32px',
            padding: '6px 8px',
            border: 'none',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette?.warning01,
            color: theme.palette?.field01,
            lineHeight: '20px',

            '&:hover': {
                fontWeight: 'bold',
            }
        },
        textContainer: {
            width: '130px'
        }
    };
});

function ShowUnreadMessagesButton(props: IUnreadMessagesButton) {
    const { unreadMessagesCounter, t } = props;
    const { container, unreadMessagesButton, arrowDownIconContainer, textContainer } = useStyles();
    const color = 'black';


    return (<div className={ `${container}` }>
        <button
            className={ `${unreadMessagesButton}` }
            aria-label={ t('chat.unreadMessages', { unreadMessagesCounter }) }
            type="button"
        >
            <Icon
                className={ arrowDownIconContainer }
                color={ color }
                size={ 14 }
                src={ IconArrowDown }
                id="test-id"
            />

            <div className={ textContainer }> { t('chat.unreadMessages', { unreadMessagesCounter }) }</div>
        </button>
    </div>);

}

export default translate(ShowUnreadMessagesButton); 
