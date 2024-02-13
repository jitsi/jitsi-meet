import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        warning: {
            bottom: 0,
            color: theme.palette.text03,
            display: 'flex',
            justifyContent: 'center',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: theme.spacing(3),
            marginTop: theme.spacing(2),
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
            position: 'absolute',
            width: '100%',

            '@media (max-width: 720px)': {
                position: 'relative'
            }
        }
    };
});

const RecordingWarning = () => {
    const { t } = useTranslation();
    const { classes } = useStyles();

    return (
        <div className = { classes.warning }>
            {t('prejoin.recordingWarning')}
        </div>
    );
};

export default RecordingWarning;
