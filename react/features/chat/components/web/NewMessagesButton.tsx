import React, {useState} from 'React';
import { makeStyles } from '@material-ui/core';
import { translate } from '../../../base/i18n';
import { Icon, IconArrowDown } from '../../../base/icons';
import { withPixelLineHeight } from '../../../base/styles/functions.web';


export interface INewMessagesButtonProps {
    t: Function;
    inputChatHeight: number;
    onGoToFirstUnreadMessage: any
}

const useStyles = makeStyles((theme: any) => {
    return {
        container: {
            position: 'absolute',
            left: 'calc(50% - 143px/2 + 0.5px)',
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
        newMessagesButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '143px',
            height: '32px',
            padding: '6px 8px',
            border: 'none',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.section01,
            boxShadow: '0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25)',

        },
        textContainer: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.field01,


            '&:hover': {
                fontWeight: 'bold',
            }
        }
    };
});

function NewMessagesButton({ inputChatHeight, onGoToFirstUnreadMessage,t }: INewMessagesButtonProps) {
    const styles = useStyles();

    return (
        <div className={ `${styles.container}`} style = {{bottom: `${inputChatHeight + 42}px`}}>
            <button
                className={ `${styles.newMessagesButton}` }
                aria-label={ t('chat.newMessages') }
                type="button"
                onClick = {onGoToFirstUnreadMessage}
            >
                <Icon
                    className={ styles.arrowDownIconContainer }
                    size={ 14 }
                    src={ IconArrowDown }
                    id="test-id"
                />

                <div className={ styles.textContainer }> { t('chat.newMessages') }</div>
            </button>
        </div>);

}

export default translate(NewMessagesButton);  