// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { escapeRegexp } from '../../../base/util';
import { resetSearchCriteria, toggleFacialExpressions, initSearch } from '../../actions';
import { REDUCE_EXPRESSIONS_THRESHOLD } from '../../constants';

import FacialExpressionsSwitch from './FacialExpressionsSwitch';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';

const useStyles = makeStyles(theme => {
    return {
        separator: {
            position: 'absolute',
            width: '100%',
            height: 1,
            left: 0,
            backgroundColor: theme.palette.border02
        }
    };
});

const SpeakerStats = () => {
    const { enableFacialRecognition } = useSelector(state => state['features/base/config']);
    const { showFacialExpressions } = useSelector(state => state['features/speaker-stats']);
    const { clientWidth } = useSelector(state => state['features/base/responsive-ui']);
    const reduceExpressions = clientWidth < REDUCE_EXPRESSIONS_THRESHOLD;
    const dispatch = useDispatch();
    const classes = useStyles();

    const onToggleFacialExpressions = useCallback(() =>
        dispatch(toggleFacialExpressions())
    , [ dispatch ]);

    const onSearch = useCallback((criteria = '') => {
        dispatch(initSearch(escapeRegexp(criteria)));
    }
    , [ dispatch ]);

    useEffect(() => () => dispatch(resetSearchCriteria()), []);

    return (
        <Dialog
            cancelKey = 'dialog.close'
            submitDisabled = { true }
            titleKey = 'speakerStats.speakerStats'
            width = { showFacialExpressions ? '664px' : 'small' }>
            <div className = 'speaker-stats'>
                <SpeakerStatsSearch onSearch = { onSearch } />
                { enableFacialRecognition
                    && <FacialExpressionsSwitch
                        onChange = { onToggleFacialExpressions }
                        showFacialExpressions = { showFacialExpressions } />
                }
                <SpeakerStatsLabels
                    reduceExpressions = { reduceExpressions }
                    showFacialExpressions = { showFacialExpressions ?? false } />
                <div className = { classes.separator } />
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
