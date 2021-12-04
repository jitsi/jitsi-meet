/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { createLocalizedTime } from '../timeFunctions';

/**
 * The type of the React {@code Component} props of {@link TimeElapsed}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function,

    /**
     * The milliseconds to be converted into a human-readable format.
     */
    time: number
};

/**
 * React component for displaying total time elapsed. Converts a total count of
 * milliseconds into a more humanized form: "# hours, # minutes, # seconds".
 * With a time of 0, "0s" will be displayed.
 *
 * @augments Component
 */
class TimeElapsed extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { time, t } = this.props;
        const timeElapsed = createLocalizedTime(time, t);

        return (
            <div>
                { timeElapsed }
            </div>
        );
    }
}

export default translate(TimeElapsed);
