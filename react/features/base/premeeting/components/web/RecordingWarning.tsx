import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { IconRecord } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            backgroundColor: theme.palette.warning01,
            borderRadius: theme.shape.borderRadius,
            color: theme.palette.text04,
            display: 'flex',
            justifyContent: 'center',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: theme.spacing(3),
            marginTop: theme.spacing(2),
            paddingBottom: theme.spacing(2),
            paddingTop: theme.spacing(2),
            width: '100%'
        },
        warning: {
            alignItems: 'center',
            display: 'flex',
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3)
        },
        text: {
            fontWeight: 600,
            paddingLeft: theme.spacing(2)
        }
    };
});

const RecordingWarning = () => {
    const { t } = useTranslation();
    const { classes, theme } = useStyles();
    const color = theme.palette.icon04;

    return (
        <div className = { classes.container }>
            <div className = { classes.warning }>
                <Icon
                    color = { color }
                    src = { IconRecord } />
                <span className = { classes.text }>
                    {t('prejoin.recordingWarning')}
                </span>
            </div>
        </div>
    );
};

export default RecordingWarning;
