import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalizedDurationFormatter } from '../../../base/i18n/dateUtil';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';

/**
 * Description for the sticky "Timer ended" notification. Re-renders every
 * second as the overrun counter ticks.
 *
 * @returns {ReactElement}
 */
function TimeTimerEndedDescription() {
    const { t } = useTranslation();
    const overSeconds = useSelector((state: IReduxState) => state['features/time-timer'].overSeconds);

    // Split on a sentinel so the time span can be coloured without a new
    // translation key.
    const TIME_PLACEHOLDER = '__TIME__';
    const raw = t('timeTimer.endedOver', { time: TIME_PLACEHOLDER });
    const [ pre, post ] = raw.split(TIME_PLACEHOLDER);

    return (
        <span>
            {pre}
            <span style = {{ color: BaseTheme.palette.timeTimerExpiredNotificationText }}>
                {getLocalizedDurationFormatter(overSeconds * 1000)}
            </span>
            {post}
        </span>
    );
}

export default TimeTimerEndedDescription;
