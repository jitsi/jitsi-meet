import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { admitMultiple, goLive } from '../../../visitors/actions';
import {
    getPromotionRequests,
    getVisitorsCount,
    getVisitorsInQueueCount,
    isVisitorsLive
} from '../../../visitors/functions';

import { VisitorsItem } from './VisitorsItem';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: `${theme.spacing(3)} 0`
        },
        headingW: {
            color: theme.palette.warning02
        },
        drawerActions: {
            listStyleType: 'none',
            margin: 0,
            padding: 0
        },
        drawerItem: {
            alignItems: 'center',
            color: theme.palette.text01,
            display: 'flex',
            padding: '12px 16px',
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),

            '&:first-child': {
                marginTop: '15px'
            },

            '&:hover': {
                cursor: 'pointer',
                background: theme.palette.action02
            }
        },
        icon: {
            marginRight: 16
        },
        headingContainer: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
        },
        heading: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.text02
        },
        link: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.link01,
            cursor: 'pointer'
        }
    };
});

/**
 * Component used to display a list of visitors waiting for approval to join the main meeting.
 *
 * @returns {ReactNode}
 */
export default function VisitorsList() {
    const requests = useSelector(getPromotionRequests);
    const visitorsCount = useSelector(getVisitorsCount);
    const visitorsInQueueCount = useSelector(getVisitorsInQueueCount);
    const isLive = useSelector(isVisitorsLive);
    const showVisitorsInQueue = visitorsInQueueCount > 0 && isLive === false;

    const { t } = useTranslation();
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();

    const admitAll = useCallback(() => {
        dispatch(admitMultiple(requests));
    }, [ dispatch, requests ]);

    const goLiveCb = useCallback(() => {
        dispatch(goLive());
    }, [ dispatch ]);

    if (visitorsCount <= 0 && !showVisitorsInQueue) {
        return null;
    }

    return (
        <>
            <div className = { classes.headingContainer }>
                <div className = { cx(classes.heading, classes.headingW) }>
                    { t('participantsPane.headings.visitors', { count: visitorsCount })}
                    { requests.length > 0
                        && t('participantsPane.headings.visitorRequests', { count: requests.length }) }
                    { showVisitorsInQueue
                        && t('participantsPane.headings.visitorInQueue', { count: visitorsInQueueCount }) }
                </div>
                {
                    requests.length > 1 && !showVisitorsInQueue // Go live button is with higher priority
                    && <div
                        className = { classes.link }
                        onClick = { admitAll }>{ t('participantsPane.actions.admitAll') }</div>
                }
                {
                    showVisitorsInQueue
                    && <div
                        className = { classes.link }
                        onClick = { goLiveCb }>{ t('participantsPane.actions.goLive') }</div>
                }
            </div>
            <div
                className = { classes.container }
                id = 'visitor-list'>
                {
                    requests.map(r => (
                        <VisitorsItem
                            key = { r.from }
                            request = { r } />)
                    )
                }
            </div>
        </>
    );
}
