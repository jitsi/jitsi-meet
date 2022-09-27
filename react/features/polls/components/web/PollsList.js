// @flow

import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';


import { Icon, IconChatUnread } from '../../../base/icons';
import { browser } from '../../../base/lib-jitsi-meet';

import PollItem from './PollItem';

const PollsList = () => {
    const { t } = useTranslation();

    const polls = useSelector(state => state['features/polls'].polls);
    const pollListEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        if (pollListEndRef.current) {
            // Safari does not support options
            const param = browser.isSafari()
                ? false : {
                    behavior: 'smooth',
                    block: 'end',
                    inline: 'nearest'
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
                ? <div className = 'pane-content'>
                    <Icon
                        className = 'empty-pane-icon'
                        src = { IconChatUnread } />
                    <span className = 'empty-pane-message'>{t('polls.results.empty')}</span>
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
