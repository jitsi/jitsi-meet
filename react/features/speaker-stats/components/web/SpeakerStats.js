// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { escapeRegexp } from '../../../base/util';
import { resetSearchCriteria, toggleFacialExpressions, initSearch } from '../../actions';
import {
    DISPLAY_SWITCH_BREAKPOINT,
    MOBILE_BREAKPOINT,
    RESIZE_SEARCH_SWITCH_CONTAINER_BREAKPOINT
} from '../../constants';

import FacialExpressionsSwitch from './FacialExpressionsSwitch';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';

const useStyles = makeStyles(theme => {
    return {
        speakerStats: {
            '& .row': {
                display: 'flex',
                alignItems: 'center',

                '& .avatar': {
                    width: '32px',
                    marginRight: theme.spacing(3)
                },

                '& .name-time': {
                    width: 'calc(100% - 48px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                },

                '& .name-time_expressions-on': {
                    width: 'calc(47% - 48px)'
                },

                '& .expressions': {
                    width: 'calc(53% - 29px)',
                    display: 'flex',
                    justifyContent: 'space-between',

                    '& .expression': {
                        width: '30px',
                        textAlign: 'center'
                    }
                }
            }
        },
        footer: {
            display: 'none !important'
        },
        labelsContainer: {
            position: 'relative'
        },
        separator: {
            position: 'absolute',
            width: 'calc(100% + 48px)',
            height: 1,
            left: -24,
            backgroundColor: theme.palette.border02
        },
        searchSwitchContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        },
        searchSwitchContainerExpressionsOn: {
            width: '58.5%',
            [theme.breakpoints.down(RESIZE_SEARCH_SWITCH_CONTAINER_BREAKPOINT)]: {
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
    const displaySwitch = enableDisplayFacialExpressions && clientWidth > DISPLAY_SWITCH_BREAKPOINT;
    const displayLabels = clientWidth > MOBILE_BREAKPOINT;
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
            classes = {{ footer: classes.footer }}
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'speakerStats.speakerStats'
            width = { showFacialExpressions ? '664px' : 'small' }>
            <div className = { classes.speakerStats }>
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
                { displayLabels && (
                    <div className = { classes.labelsContainer }>
                        <SpeakerStatsLabels
                            showFacialExpressions = { showFacialExpressions ?? false } />
                        <div className = { classes.separator } />
                    </div>
                )}
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
