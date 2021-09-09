/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function
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
                <div className = 'speaker-stats-item__name'>
                    { t('speakerStats.name') }
                </div>
                <div className = 'speaker-stats-item__time'>
                    { t('speakerStats.speakerTime') }
                </div>
                <div className = 'speaker-stats-item__expression'>
                    Smiles
                </div>
                <div className = 'speaker-stats-item__expression'>
                    Neutrals
                </div>
                <div className = 'speaker-stats-item__expression'>
                    Gasps
                </div>
                <div className = 'speaker-stats-item__expression'>
                    Frowns
                </div>
                <div className = 'speaker-stats-item__expression'>
                    Total
                </div>
            </div>
        );
    }
}

export default translate(SpeakerStatsLabels);
