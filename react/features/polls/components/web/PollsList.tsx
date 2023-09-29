import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconMessage } from '../../../base/icons/svg';
import { browser } from '../../../base/lib-jitsi-meet';
import { withPixelLineHeight } from '../../../base/styles/functions.web';

import PollItem from './PollItem';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        },
        emptyIcon: {
            width: '100px',
            padding: '16px',

            '& svg': {
                width: '100%',
                height: 'auto'
            }
        },
        emptyMessage: {
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            color: theme.palette.text02,
            padding: '0 24px',
            textAlign: 'center'
        }
    };
});

const PollsList = () => {
    const { t } = useTranslation();
    const { classes, theme } = useStyles();

    const polls = useSelector((state: IReduxState) => state['features/polls'].polls);
    const pollListEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (pollListEndRef.current) {
            // Safari does not support options
            const param = browser.isSafari()
                ? false : {
                    behavior: 'smooth' as const,
                    block: 'end' as const,
                    inline: 'nearest' as const
                };

            pollListEndRef.current.scrollIntoView(param);
        }
    }, [ pollListEndRef.current ]);

    useEffect(() => {
        scrollToBottom();
    }, [ polls ]);

    const listPolls = Object.keys(polls);

    return (
        <>
            {listPolls.length === 0
                ? <div className = { classes.container }>
                    <Icon
                        className = { classes.emptyIcon }
                        color = { theme.palette.icon03 }
                        src = { IconMessage } />
                    <span className = { classes.emptyMessage }>{t('polls.results.empty')}</span>
                </div>
                : listPolls.map((id, index) => (
                    <PollItem
                        key = { id }
                        pollId = { id }
                        ref = { listPolls.length - 1 === index ? pollListEndRef : null } />
                ))}
        </>
    );
};

export default PollsList;
