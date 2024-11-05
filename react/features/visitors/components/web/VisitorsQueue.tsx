import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions';
import LoadingIndicator from '../../../base/ui/components/web/Spinner';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            backgroundColor: theme.palette.ui01,
            zIndex: 252,

            '@media (max-width: 720px)': {
                flexDirection: 'column-reverse'
            }
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
            position: 'relative',

            width: '100%',
            height: '100%',
            zIndex: 252,

            '@media (max-width: 720px)': {
                height: 'auto',
                margin: '0 auto'
            },

            // mobile phone landscape
            '@media (max-width: 420px)': {
                padding: '16px 16px 0 16px',
                width: '100%'
            },

            '@media (max-width: 400px)': {
                padding: '16px'
            }
        },
        contentControls: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 'auto',
            width: '100%'
        },
        roomName: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            marginBottom: theme.spacing(4),
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        },
        spinner: {
            margin: '8px'
        }
    };
});

/**
 * The component that renders visitors queue UI.
 *
 * @returns {ReactElement}
 */
export default function VisitorsQueue() {
    const { classes } = useStyles();
    const { t } = useTranslation();

    return (<div className = { classes.container }>
        <div className = { classes.content }>
            <div className = { classes.contentControls }>
                <span className = { classes.roomName }>
                    { t('visitors.waitingMessage') }
                </span>
                <div className = { classes.spinner }>
                    <LoadingIndicator size = 'large' />
                </div>
            </div>
        </div>
    </div>);
}
