import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import { UPGRADE_OPTIONS_LINK, UPGRADE_OPTIONS_TEXT } from '../../../constants';

const useStyles = makeStyles()(theme => {
    return {
        limitContainer: {
            backgroundColor: theme.palette.warning01,
            borderRadius: '6px',
            padding: '8px 16px'
        },
        limitInfo: {
            color: theme.palette.text.primary,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        },
        link: {
            color: `${theme.palette.text.primary} !important`,
            fontWeight: 'bold',
            textDecoration: 'underline'
        }
    };
});

/**
 * Component that displays a message when the dial in limit is reached.
 * * @param {Function} t - Function which translate strings.
 *
 * @returns {ReactElement}
 */
const DialInLimit: React.FC<WithTranslation> = ({ t }) => {
    const { classes } = useStyles();

    return (
        <div className = { classes.limitContainer }>
            <span className = { classes.limitInfo }>
                <b>{ `${t('info.dialInNumber')} ` }</b>
                { `${t('info.reachedLimit')} `}
                { `${t('info.upgradeOptions')} ` }
                <a
                    className = { classes.link }
                    href = { UPGRADE_OPTIONS_LINK }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { `${UPGRADE_OPTIONS_TEXT}` }
                </a>
                .
            </span>
        </div>
    );
};

export default translate(DialInLimit);
