import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { getDialInfoPageURL, shouldDisplayDialIn } from '../../invite/functions';

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @returns {ReactElement|null}
 */
const DialInLink = () => {
    const { t } = useTranslation();
    const dialIn = useSelector((state: IReduxState) => state['features/invite']);
    const dialInfoPageUrl = useSelector((state: IReduxState) => getDialInfoPageURL(state));

    if (!shouldDisplayDialIn(dialIn)) {
        return null;
    }

    return (
        <div>{t('toolbar.noAudioSignalDialInDesc')}&nbsp;
            <a
                href = { dialInfoPageUrl }
                rel = 'noopener noreferrer'
                target = '_blank'>
                {t('toolbar.noAudioSignalDialInLinkDesc')}
            </a>
        </div>
    );
};

export default DialInLink;
