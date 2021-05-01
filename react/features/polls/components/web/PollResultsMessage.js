// @flow

import React from 'react';

import AbstractPollResultsMessage from '../AbstractPollResultsMessage';
import type { AbstractProps } from '../AbstractPollResultsMessage';

/**
 * Component that renders a poll result message for chat.
 *
 * @returns {React.Node}
 */
const PollResultsMessage = ({ children, detailsText, noticeText, showDetails }: AbstractProps) => <>
    { children }
    <div className = 'poll-message-footer'>
        <div className = 'poll-notice'>{ noticeText }</div>
        <button
            className = 'poll-show-details'
            onClick = { showDetails }
            type = 'button'>
            { detailsText }
        </button>
    </div>
    </>;

/*
 * We apply AbstractPollResultsMessage to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResultsMessage(PollResultsMessage);
