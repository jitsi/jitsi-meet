import React from 'react';
import { useTranslation } from 'react-i18next';

import { createLocalizedTime } from '../timeFunctions';

/**
 * The type of the React {@code Component} props of {@link TimeElapsed}.
 */
interface IProps {

    /**
     * The milliseconds to be converted into a human-readable format.
     */
    time: number;
}

/**
 * React component for displaying total time elapsed. Converts a total count of
 * milliseconds into a more humanized form: "# hours, # minutes, # seconds".
 * With a time of 0, "0s" will be displayed.
 *
 * @augments Component
 */

const TimeElapsed = ({ time }: IProps) => {
    const { t } = useTranslation();
    const timeElapsed = createLocalizedTime(time, t);

    return (
        <span>
            { timeElapsed }
        </span>
    );
};

export default TimeElapsed;
