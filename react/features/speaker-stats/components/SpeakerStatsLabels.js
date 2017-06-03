import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * React component for labeling speaker stats column items.
 *
 * @extends Component
 */
class SpeakerStatsLabels extends Component {
    /**
     * SpeakerStatsLabels component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The function to translate human-readable text.
         */
        t: React.PropTypes.func
    };

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
            </div>
        );
    }
}

export default translate(SpeakerStatsLabels);
