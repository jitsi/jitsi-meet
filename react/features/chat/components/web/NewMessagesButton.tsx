import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';

export interface INewMessagesButtonProps extends WithTranslation {

    /**
     * Function to notify messageContainer when click on goToFirstUnreadMessage button.
     */
    onGoToFirstUnreadMessage: () => void;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'absolute',
            left: 'calc(50% - 72px)',
            bottom: '15px'
        },

        newMessagesButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '32px',
            padding: '8px',
            border: 'none',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.action02,
            boxShadow: '0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25)',

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            },

            '&:active': {
                backgroundColor: theme.palette.action02Active
            }
        },

        arrowDownIconContainer: {
            height: '20px',
            width: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },

        textContainer: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text04,
            paddingLeft: '8px'
        }
    };
});

/** NewMessagesButton.
 *
 * @param {Function} onGoToFirstUnreadMessage - Function for lifting up onClick event.
 * @returns {JSX.Element}
 */
function NewMessagesButton({ onGoToFirstUnreadMessage, t }: INewMessagesButtonProps): JSX.Element {
    const { classes: styles } = useStyles();

    return (
        <div
            className = { styles.container }>
            <button
                aria-label = { t('chat.newMessages') }
                className = { styles.newMessagesButton }
                onClick = { onGoToFirstUnreadMessage }
                type = 'button'>
                <Icon
                    className = { styles.arrowDownIconContainer }
                    color = { BaseTheme.palette.icon04 }
                    size = { 14 }
                    src = { IconArrowDown } />
                <div className = { styles.textContainer }> { t('chat.newMessages') }</div>
            </button>
        </div>
    );
}

export default translate(NewMessagesButton);
