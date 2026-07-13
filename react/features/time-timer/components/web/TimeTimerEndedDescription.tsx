import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalizedDurationFormatter } from '../../../base/i18n/dateUtil';
import { EXPIRED_NOTIFICATION_TEXT_COLOR } from '../../functions';

/**
 * Description for the sticky "Timer ended" notification. Subscribes to the
 * timer's overrun counter directly so only this text node re-renders each
 * second — the notification itself is dispatched once at expiry and never
 * touched again. This keeps middleware free of React-element construction and
 * avoids re-pushing the notification through its reducer every tick.
 *
 * @returns {ReactElement}
 */
function TimeTimerEndedDescription() {
    const { t } = useTranslation();
    const overSeconds = useSelector((state: IReduxState) => state['features/time-timer'].overSeconds);

    // The localized string carries a {{time}} placeholder; we split on a
    // unique sentinel so we can colour the time span without inventing a new
    // translation key. The time uses the same formatter as the pill so the
    // two never disagree (e.g. 1:15:03, not 75:03).
    const TIME_PLACEHOLDER = '__TIME__';
    const raw = t('timeTimer.endedOver', { time: TIME_PLACEHOLDER });
    const [ pre, post ] = raw.split(TIME_PLACEHOLDER);

    return (
        <span>
            {pre}
            <span style = {{ color: EXPIRED_NOTIFICATION_TEXT_COLOR }}>
                {getLocalizedDurationFormatter(overSeconds * 1000)}
            </span>
            {post}
        </span>
    );
}

export default TimeTimerEndedDescription;
