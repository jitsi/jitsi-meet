/* eslint-disable react/no-multi-comp */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { normalizeAccents } from '../../../base/util/strings.web';
import { subscribeVisitorsList } from '../../../visitors/actions';
import {
    getVisitorsCount,
    getVisitorsList,
    isVisitorsListEnabled,
    isVisitorsListSubscribed,
    shouldDisplayCurrentVisitorsList
} from '../../../visitors/functions';
import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';

import ParticipantItem from './ParticipantItem';

/**
 * Props for the {@code CurrentVisitorsList} component.
 */
interface IProps {
    searchString: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            marginTop: theme.spacing(3),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flexGrow: 1
        },
        heading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: `${theme.spacing(1)} 0`,
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.text02,
            flexShrink: 0
        },
        arrowContainer: {
            backgroundColor: theme.palette.ui03,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            marginLeft: theme.spacing(2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
        },
        listContainer: {
            flex: 1,
            minHeight: '200px',
            maxHeight: '100%'
        }
    };
});

/**
 * Renders the visitors list inside the participants pane.
 *
 * @param {IProps} props - Component props.
 * @returns {React$Element<any>} The component.
 */
export default function CurrentVisitorsList({ searchString }: IProps) {
    const visitorsCount = useSelector(getVisitorsCount);
    const visitors = useSelector(getVisitorsList);
    const featureEnabled = useSelector(isVisitorsListEnabled);
    const shouldDisplayList = useSelector(shouldDisplayCurrentVisitorsList);
    const { defaultRemoteDisplayName } = useSelector((state: IReduxState) => state['features/base/config']);
    const { t } = useTranslation();
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const [ collapsed, setCollapsed ] = useState(true);
    const isSubscribed = useSelector(isVisitorsListSubscribed);

    const toggleCollapsed = useCallback(() => {
        setCollapsed(c => {
            const newCollapsed = !c;

            if (featureEnabled && !newCollapsed && !isSubscribed) {
                dispatch(subscribeVisitorsList());
            }

            return newCollapsed;
        });
    }, [ dispatch, isSubscribed, featureEnabled ]);

    useEffect(() => {
        if (featureEnabled && searchString) {
            setCollapsed(false);
            if (!isSubscribed) {
                dispatch(subscribeVisitorsList());
            }
        }
    }, [ searchString, dispatch, isSubscribed, featureEnabled ]);

    if (!shouldDisplayList) {
        return null;
    }

    const filtered = visitors.filter(v => {
        const displayName = v.name || defaultRemoteDisplayName || 'Fellow Jitster';

        return normalizeAccents(displayName).toLowerCase().includes(normalizeAccents(searchString).toLowerCase());
    });

    // ListItem height is 56px including padding so the item size
    // for virtualization needs to match it exactly to avoid clipping.
    const itemSize = 56;

    const Row = ({ index, style }: { index: number; style: any; }) => {
        const v = filtered[index];

        return (
            <div style = { style }>
                <ParticipantItem
                    actionsTrigger = { ACTION_TRIGGER.HOVER }
                    audioMediaState = { MEDIA_STATE.NONE }
                    displayName = { v.name || defaultRemoteDisplayName || 'Fellow Jitster' }
                    participantID = { v.id }
                    videoMediaState = { MEDIA_STATE.NONE } />
            </div>
        );
    };
    const styles = {
        overflowX: 'hidden' as const,
        overflowY: 'auto' as const,
    };

    return (
        <div className = { classes.container }>
            <div
                className = { classes.heading }
                onClick = { toggleCollapsed }>
                <span>{ t('participantsPane.headings.visitorsList', { count: visitorsCount }) }</span>
                <span className = { classes.arrowContainer }>
                    <Icon
                        size = { 14 }
                        src = { collapsed ? IconArrowDown : IconArrowUp } />
                </span>
            </div>
            {!collapsed && (
                <div className = { classes.listContainer }>
                    <AutoSizer>
                        { ({ height, width }) => (
                            <FixedSizeList
                                height = { Math.max(height, 200) }
                                itemCount = { filtered.length }
                                itemSize = { itemSize }
                                style = { styles }
                                width = { width }>
                                { Row }
                            </FixedSizeList>
                        )}
                    </AutoSizer>
                </div>
            )}
        </div>
    );
}
