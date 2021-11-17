/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { Tooltip } from '../../base/tooltip';
import { FACIAL_EXPRESSION_EMOJIS } from '../../facial-recognition/constants.js';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * True if the client width is les than 750.
     */
    reduceExpressions: boolean,

    /**
     * True if the facial recognition is not disabled.
     */
    showFacialExpressions: boolean,

    /**
     * The function to translate human-readable text.
     */
    t: Function,
};

/**
 * React component for labeling speaker stats column items.
 *
 * @augments Component
 */
class SpeakerStatsLabels extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = 'speaker-stats-item__labels'>
                <div className = 'speaker-stats-item__status' />
                <div
                    className = { `speaker-stats-item__name${
                        this.props.showFacialExpressions ? '_expressions_on' : ''
                    }` }>
                    { t('speakerStats.name') }
                </div>
                <div
                    className = { `speaker-stats-item__time${
                        this.props.showFacialExpressions ? '_expressions_on' : ''
                    }` }>
                    { t('speakerStats.speakerTime') }
                </div>
                {this.props.showFacialExpressions
                    && (this.props.reduceExpressions
                        ? Object.keys(FACIAL_EXPRESSION_EMOJIS)
                            .filter(expression => ![ 'angry', 'fearful', 'disgusted' ].includes(expression))
                        : Object.keys(FACIAL_EXPRESSION_EMOJIS)
                    ).map(
                    expression => (
                        <div
                            className = 'speaker-stats-item__expression'
                            key = { expression }>
                            <Tooltip
                                content = { t(`speakerStats.${expression}`) }
                                position = { 'top' } >
                                <div
                                    // eslint-disable-next-line react-native/no-inline-styles
                                    style = {{ fontSize: 17 }}>

                                    { FACIAL_EXPRESSION_EMOJIS[expression] }
                                </div>

                            </Tooltip>
                        </div>

                    ))
                }
            </div>
        );
    }
}

export default translate(SpeakerStatsLabels);
