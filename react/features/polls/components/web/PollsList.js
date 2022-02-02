// @flow

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Icon, IconChatUnread } from '../../../base/icons';

import PollItem from './PollItem';

const PollsList = () => {
    const { t } = useTranslation();

    const polls = useSelector(state => state['features/polls'].polls);
    const pollListEndRef = useRef(null);

    const scrollToBottom = () => {
        if (pollListEndRef.current) {
            pollListEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
