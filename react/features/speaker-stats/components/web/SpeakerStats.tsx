import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Dialog from '../../../base/ui/components/web/Dialog';
import { escapeRegexp } from '../../../base/util/helpers';
import { initSearch, resetSearchCriteria, toggleFaceExpressions } from '../../actions';
import {
    DISPLAY_SWITCH_BREAKPOINT,
    MOBILE_BREAKPOINT,
    RESIZE_SEARCH_SWITCH_CONTAINER_BREAKPOINT
} from '../../constants';

import FaceExpressionsSwitch from './FaceExpressionsSwitch';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';

const useStyles = makeStyles()(theme => {
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
        labelsContainer: {
            position: 'relative'
        },
        separator: {
            position: 'absolute',
            width: 'calc(100% + 48px)',
            height: 1,
            left: -24,
            backgroundColor: theme.palette.ui05
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
    const { faceLandmarks } = useSelector((state: IReduxState) => state['features/base/config']);
    const { showFaceExpressions } = useSelector((state: IReduxState) => state['features/speaker-stats']);
    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const displaySwitch = faceLandmarks?.enableDisplayFaceExpressions && clientWidth > DISPLAY_SWITCH_BREAKPOINT;
    const displayLabels = clientWidth > MOBILE_BREAKPOINT;
    const dispatch = useDispatch();
    const { classes } = useStyles();

    const onToggleFaceExpressions = useCallback(() =>
        dispatch(toggleFaceExpressions())
    , [ dispatch ]);

    const onSearch = useCallback((criteria = '') => {
        dispatch(initSearch(escapeRegexp(criteria)));
    }
    , [ dispatch ]);

    useEffect(() => {
        showFaceExpressions && !displaySwitch && dispatch(toggleFaceExpressions());
    }, [ clientWidth ]);
    useEffect(() => () => {
        dispatch(resetSearchCriteria());
    }, []);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            size = { showFaceExpressions ? 'large' : 'medium' }
            titleKey = 'speakerStats.speakerStats'>
            <div className = { classes.speakerStats }>
                <div
                    className = {
                        `${classes.searchSwitchContainer}
                        ${showFaceExpressions ? classes.searchSwitchContainerExpressionsOn : ''}`
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
                    && <FaceExpressionsSwitch
                        onChange = { onToggleFaceExpressions }
                        showFaceExpressions = { showFaceExpressions } />
                    }
                </div>
                { displayLabels && (
                    <div className = { classes.labelsContainer }>
                        <SpeakerStatsLabels
                            showFaceExpressions = { showFaceExpressions ?? false } />
                        <div className = { classes.separator } />
                    </div>
                )}
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
