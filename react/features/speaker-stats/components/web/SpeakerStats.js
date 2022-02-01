// @flow

import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { resetSearchCriteria, toggleFacialExpressions } from '../../actions';
import { REDUCE_EXPRESSIONS_THRESHOLD } from '../../constants';

import FacialExpressionsSwitch from './FacialExpressionsSwitch';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';

const SpeakerStats = () => {
    const { enableFacialRecognition } = useSelector(state => state['features/base/config']);
    const { showFacialExpressions } = useSelector(state => state['features/speaker-stats']);
    const { clientWidth } = useSelector(state => state['features/base/responsive-ui']);
    const reduceExpressions = clientWidth < REDUCE_EXPRESSIONS_THRESHOLD;
    const dispatch = useDispatch();

    const onToggleFacialExpressions = useCallback(() =>
        dispatch(toggleFacialExpressions())
    , [ dispatch ]);

    useEffect(() => () => dispatch(resetSearchCriteria()), []);

    return (
        <Dialog
            cancelKey = 'dialog.close'
            submitDisabled = { true }
            titleKey = 'speakerStats.speakerStats'
            width = { showFacialExpressions ? 'large' : 'small' }>
            <div className = 'speaker-stats'>
                <SpeakerStatsSearch />
                { enableFacialRecognition
                    && <FacialExpressionsSwitch
                        onChange = { onToggleFacialExpressions }
                        showFacialExpressions = { showFacialExpressions } />
                }
                <SpeakerStatsLabels
                    reduceExpressions = { reduceExpressions }
                    showFacialExpressions = { showFacialExpressions ?? false } />
                <div className = 'separator-line' />
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
