import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import { getDialInfoPageURL, hasMultipleNumbers } from '../../../functions';

import DialInNumber from './DialInNumber';

interface IProps {

    /**
     * The phone number to dial to begin the process of dialing into a
     * conference.
     */
    phoneNumber: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            '& .info-label': {
                ...withPixelLineHeight(theme.typography.bodyLongBold)
            }
        },

        link: {
            ...withPixelLineHeight(theme.typography.bodyLongRegular),
            color: theme.palette.link01,

            '&:hover': {
                color: theme.palette.link01Hover
            }
        }
    };
});

/**
 * Returns a ReactElement for showing how to dial into the conference, if
 * dialing in is available.
 *
 * @private
 * @returns {null|ReactElement}
 */
function DialInSection({
    phoneNumber
}: IProps) {
    const { classes, cx } = useStyles();
    const conferenceID = useSelector((state: IReduxState) => state['features/invite'].conferenceID);
    const dialInfoPageUrl: string = useSelector(getDialInfoPageURL);
    const showMoreNumbers = useSelector((state: IReduxState) => hasMultipleNumbers(state['features/invite'].numbers));
    const { t } = useTranslation();

    return (
        <div className = { classes.container }>
            <DialInNumber
                conferenceID = { conferenceID ?? '' }
                phoneNumber = { phoneNumber } />
            {showMoreNumbers ? <a
                className = { cx('more-numbers', classes.link) }
                href = { dialInfoPageUrl }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t('info.moreNumbers') }
            </a> : null}
        </div>
    );
}

export default DialInSection;
