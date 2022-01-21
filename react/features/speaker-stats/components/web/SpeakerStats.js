// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { escapeRegexp } from '../../../base/util';
import { resetSearchCriteria, toggleFacialExpressions, initSearch } from '../../actions';

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
        },
        speakerStatsDialog: {
            '& > div': {

            }
        },
        searchSwitchContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        },
        searchSwitchContainerExpressionsOn: {
            width: '58.5%',
            [theme.breakpoints.down('750')]: {
                width: '100%'
            }
        },
        searchContainer: {
            width: '50%'
        },
        searchContainerFullWidth: {
            width: '100%'
        }
    };
});

const SpeakerStats = () => {
    const { enableDisplayFacialExpressions } = useSelector(state => state['features/base/config']);
    const { showFacialExpressions } = useSelector(state => state['features/speaker-stats']);
    const { clientWidth } = useSelector(state => state['features/base/responsive-ui']);
    const displaySwitch = enableDisplayFacialExpressions && clientWidth > 600;
    const dispatch = useDispatch();
    const classes = useStyles();

    const onToggleFacialExpressions = useCallback(() =>
        dispatch(toggleFacialExpressions())
    , [ dispatch ]);

    const onSearch = useCallback((criteria = '') => {
        dispatch(initSearch(escapeRegexp(criteria)));
    }
    , [ dispatch ]);

    useEffect(() => {
        showFacialExpressions && !displaySwitch && dispatch(toggleFacialExpressions());
    }, [ clientWidth ]);

    useEffect(() => () => dispatch(resetSearchCriteria()), []);

    return (
        <Dialog
            cancelKey = 'dialog.close'
            hideCancelButton = { true }
            id = 'speaker-stats-dialog'
            submitDisabled = { true }
            titleKey = 'speakerStats.speakerStats'
            width = { showFacialExpressions ? '664px' : 'small' }>
            <div className = 'speaker-stats'>
                <div
                    className = {
                        `${classes.searchSwitchContainer}
                        ${showFacialExpressions ? classes.searchSwitchContainerExpressionsOn : ''}`
                    }>
                    <div
                        className = {
                            displaySwitch
                                ? classes.searchContainer
                                : classes.searchContainerFullWidth }>
                        <SpeakerStatsSearch
                            onSearch = { onSearch } />
                    </div>

                    { displaySwitch
                    && <FacialExpressionsSwitch
                        onChange = { onToggleFacialExpressions }
                        showFacialExpressions = { showFacialExpressions } />
                    }
                </div>

                <SpeakerStatsLabels
                    showFacialExpressions = { showFacialExpressions ?? false } />
                <div className = { classes.separator } />
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
