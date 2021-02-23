// @flow

import { ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import React from 'react';

import { translate } from '../../base/i18n';

import SpeakerStatsSearch from './SpeakerStatsSearch';


type Props = {

    /**
     * Invoked to search.
     */
    onSearch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Custom header of {@code SpeakerStats}.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsHeader({ onSearch, t }: Props) {
    return (
        <div
            className = 'speaker-stats-header'>
            <div
                className = 'speaker-stats-heading' >
                <ModalHeader>
                    <ModalTitle>
                        { t('speakerStats.speakerStats') }
                    </ModalTitle>
                </ModalHeader>
            </div>
            <SpeakerStatsSearch
                onSearch = { onSearch } />
        </div>
    );
}

export default translate(SpeakerStatsHeader);
