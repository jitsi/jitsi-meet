import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import { createLocalizedTime } from '../timeFunctions';

/**
 * The type of the React {@code Component} props of {@link TimeElapsed}.
 */
interface IProps extends WithTranslation {

    /**
     * Optional accessibility label prefix.
     */
    accessibilityLabel?: string;

    /**
     * Style for text.
     */
    style: Object;

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
class TimeElapsed extends PureComponent<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { accessibilityLabel, style, time, t } = this.props;
        const timeElapsed = createLocalizedTime(time, t);
        const timeStr = timeElapsed.join(' ');
        const label = accessibilityLabel ? `${accessibilityLabel}: ${timeStr}` : timeStr;

        return (
            <Text
                accessibilityLabel = { label }
                style = { style }>
                { timeElapsed }
            </Text>
        );
    }
}

export default translate(TimeElapsed);
