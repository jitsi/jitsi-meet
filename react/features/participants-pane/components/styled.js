import { makeStyles } from '@material-ui/core/styles';

import { withPixelLineHeight } from '../../base/styles/functions.web';

export const useButtonStyles = makeStyles(theme => {
    return {
        button: {
            alignItems: 'center',
            backgroundColor: theme.palette.action01,
            border: 0,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            justifyContent: 'center',
            minHeight: 32,
            ...withPixelLineHeight(theme.typography.labelButton),

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            }
        },
        buttonSecondary: {
            backgroundColor: theme.palette.action02,

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            }
        },
        quickActionButton: {
            padding: '0 12px'
        }
    };
});

export const useItemStyles = makeStyles(theme => {
    return {
        itemClass: {
            alignItems: 'center',
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'flex',
            minHeight: 40,
            padding: '8px 16px',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),

            '& > *:not(:last-child)': {
                marginRight: '16px'
            },

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            },

            '@media (max-width: 580px)': {
                minHeight: 48,
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            }
        }
    };
});
