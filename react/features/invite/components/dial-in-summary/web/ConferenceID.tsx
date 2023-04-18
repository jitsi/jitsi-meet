import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import { _formatConferenceIDPin } from '../../../_utils';


interface IProps extends WithTranslation {

    /**
     * The conference id.
     */
    conferenceID?: string | number;

    /**
     * The conference name.
     */
    conferenceName: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            marginTop: 32,
            maxWidth: 310,
            padding: '16px 12px',
            background: theme.palette.ui02,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 6,

            '& *': {
                userSelect: 'text'
            }
        },
        confNameLabel: {
            ...withPixelLineHeight(theme.typography.heading6),
            marginBottom: 18,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        descriptionLabel: {
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),
            marginBottom: 18
        },
        separator: {
            width: '100%',
            height: 1,
            background: theme.palette.ui04,
            marginBottom: 18
        },
        pinLabel: {
            ...withPixelLineHeight(theme.typography.heading6)
        }
    };
});

const ConferenceID: React.FC<IProps> = ({ conferenceID, t }) => {
    const { classes: styles } = useStyles();

    return (
        <div className = { styles.container }>
            <div className = { styles.descriptionLabel }>
                To join the meeting via phone, dial one of these numbers and then enter the pin
            </div>
            <div className = { styles.separator } />
            <div className = { styles.pinLabel }>
                { `${t('info.dialInConferenceID')} ${_formatConferenceIDPin(conferenceID ?? '')}` }
            </div>
        </div>
    );
};

export default translate(ConferenceID);
