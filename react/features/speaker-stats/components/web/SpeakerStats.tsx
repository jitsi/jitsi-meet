import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import {
    IconEmotionsAngry,
    IconEmotionsDisgusted,
    IconEmotionsFearful,
    IconEmotionsHappy,
    IconEmotionsNeutral,
    IconEmotionsSad,
    IconEmotionsSurprised
} from '../../../base/icons/svg';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import Dialog from '../../../base/ui/components/web/Dialog';
import { escapeRegexp } from '../../../base/util/helpers';
import { initSearch, resetSearchCriteria, toggleFaceExpressions } from '../../actions.any';
import {
    DISPLAY_SWITCH_BREAKPOINT,
    MOBILE_BREAKPOINT
} from '../../constants';

import FaceExpressionsSwitch from './FaceExpressionsSwitch';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';

const useStyles = makeStyles()(theme => {
    return {
        speakerStats: {
            '& .header': {
                position: 'fixed',
                backgroundColor: theme.palette.ui01,
                paddingLeft: theme.spacing(4),
                paddingRight: theme.spacing(4),
                marginLeft: `-${theme.spacing(4)}`,
                '&.large': {
                    width: '616px'
                },
                '&.medium': {
                    width: '352px'
                },
                '@media (max-width: 448px)': {
                    width: 'calc(100% - 48px) !important'
                },
                '& .upper-header': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    '& .search-switch-container': {
                        display: 'flex',
                        width: '100%',
                        '& .search-container': {
                            width: 175,
                            marginRight: theme.spacing(3)
                        },
                        '& .search-container-full-width': {
                            width: '100%'
                        }
                    },
                    '& .emotions-icons': {
                        display: 'flex',
                        '& svg': {
                            fill: '#000'
                        },
                        '&>div': {
                            marginRight: theme.spacing(3)
                        },
                        '&>div:last-child': {
                            marginRight: 0
                        }
                    }
                }
            },
            '& .row': {
                display: 'flex',
                alignItems: 'center',
                '& .name-time': {
                    width: 'calc(100% - 48px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&.expressions-on': {
                        width: 'calc(47% - 48px)',
                        marginRight: theme.spacing(4)
                    }
                },
                '& .timeline-container': {
                    height: '100%',
                    width: `calc(53% - ${theme.spacing(4)})`,
                    display: 'flex',
                    alignItems: 'center',
                    borderLeftWidth: 1,
                    borderLeftColor: theme.palette.ui02,
                    borderLeftStyle: 'solid',
                    '& .timeline': {
                        height: theme.spacing(2),
                        display: 'flex',
                        width: '100%',
                        '&>div': {
                            marginRight: theme.spacing(1),
                            borderRadius: 5
                        },
                        '&>div:first-child': {
                            borderRadius: '0 5px 5px 0'
                        },
                        '&>div:last-child': {
                            marginRight: 0,
                            borderRadius: '5px 0 0 5px'
                        }
                    }
                },
                '& .axis-container': {
                    height: '100%',
                    width: `calc(53% - ${theme.spacing(6)})`,
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: theme.spacing(3),
                    '& div': {
                        borderRadius: 5
                    },
                    '& .axis': {
                        height: theme.spacing(1),
                        display: 'flex',
                        width: '100%',
                        backgroundColor: theme.palette.ui03,
                        position: 'relative',
                        '& .left-bound': {
                            position: 'absolute',
                            bottom: 10,
                            left: 0
                        },
                        '& .right-bound': {
                            position: 'absolute',
                            bottom: 10,
                            right: 0
                        },
                        '& .handler': {
                            position: 'absolute',
                            backgroundColor: theme.palette.ui09,
                            height: 12,
                            marginTop: -4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            '& .resize': {
                                height: '100%',
                                width: 5,
                                cursor: 'col-resize'
                            }
                        }
                    }
                }
            },
            '& .separator': {
                width: 'calc(100% + 48px)',
                height: 1,
                marginLeft: -24,
                backgroundColor: theme.palette.ui02
            }
        }
    };
});

const EMOTIONS_LEGEND = [
    {
        translationKey: 'speakerStats.neutral',
        icon: IconEmotionsNeutral
    },
    {
        translationKey: 'speakerStats.happy',
        icon: IconEmotionsHappy
    },
    {
        translationKey: 'speakerStats.surprised',
        icon: IconEmotionsSurprised
    },
    {
        translationKey: 'speakerStats.sad',
        icon: IconEmotionsSad
    },
    {
        translationKey: 'speakerStats.fearful',
        icon: IconEmotionsFearful
    },
    {
        translationKey: 'speakerStats.angry',
        icon: IconEmotionsAngry
    },
    {
        translationKey: 'speakerStats.disgusted',
        icon: IconEmotionsDisgusted
    }
];

const SpeakerStats = () => {
    const { faceLandmarks } = useSelector((state: IReduxState) => state['features/base/config']);
    const { showFaceExpressions } = useSelector((state: IReduxState) => state['features/speaker-stats']);
    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const displaySwitch = faceLandmarks?.enableDisplayFaceExpressions && clientWidth > DISPLAY_SWITCH_BREAKPOINT;
    const displayLabels = clientWidth > MOBILE_BREAKPOINT;
    const dispatch = useDispatch();
    const { classes } = useStyles();
    const { t } = useTranslation();

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
                <div className = { `header ${showFaceExpressions ? 'large' : 'medium'}` }>
                    <div className = 'upper-header'>
                        <div
                            className = {
                                `search-switch-container
                        ${showFaceExpressions ? 'expressions-on' : ''}`
                            }>
                            <div
                                className = {
                                    displaySwitch
                                        ? 'search-container'
                                        : 'search-container-full-width' }>
                                <SpeakerStatsSearch
                                    onSearch = { onSearch } />
                            </div>

                            { displaySwitch
                    && <FaceExpressionsSwitch
                        onChange = { onToggleFaceExpressions }
                        showFaceExpressions = { showFaceExpressions } />

                            }
                        </div>
                        { showFaceExpressions && <div className = 'emotions-icons'>
                            {
                                EMOTIONS_LEGEND.map(emotion => (
                                    <Tooltip
                                        content = { t(emotion.translationKey) }
                                        key = { emotion.translationKey }
                                        position = { 'top' }>
                                        <Icon
                                            size = { 20 }
                                            src = { emotion.icon } />
                                    </Tooltip>
                                ))
                            }
                        </div>}
                    </div>
                    { displayLabels && (
                        <SpeakerStatsLabels
                            showFaceExpressions = { showFaceExpressions ?? false } />
                    )}
                </div>
                <SpeakerStatsList />
            </div>
        </Dialog>

    );
};

export default SpeakerStats;
