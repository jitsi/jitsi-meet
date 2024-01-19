import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { admitMultiple } from '../../../visitors/actions';
import { getPromotionRequests } from '../../../visitors/functions';

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
    const visitorsCount = useSelector((state: IReduxState) => state['features/visitors'].count || 0);

    const { t } = useTranslation();
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();

    const admitAll = useCallback(() => {
        dispatch(admitMultiple(requests));
    }, [ dispatch, requests ]);

    if (visitorsCount <= 0) {
        return null;
    }

    return (
        <>
            <div className = { classes.headingContainer }>
                <div className = { cx(classes.heading, classes.headingW) }>
                    { t('participantsPane.headings.visitors', { count: visitorsCount })}
                    { requests.length > 0
                        && t('participantsPane.headings.visitorRequests', { count: requests.length }) }
                </div>
                {
                    requests.length > 1
                    && <div
                        className = { classes.link }
                        onClick = { admitAll }>{t('participantsPane.actions.admitAll')}</div>
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
