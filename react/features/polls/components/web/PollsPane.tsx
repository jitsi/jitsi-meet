/* eslint-disable lines-around-comment */
import React from 'react';

import Button from '../../../base/ui/components/web/Button';
// @ts-ignore
import AbstractPollsPane from '../AbstractPollsPane';
// @ts-ignore
import type { AbstractProps } from '../AbstractPollsPane';

import PollCreate from './PollCreate';
// @ts-ignore
import PollsList from './PollsList';
// @ts-ignore
import PollsDownload from './PollsDownload';


const PollsPane = (props: AbstractProps) => {
    const { createMode, onCreate, setCreateMode, t } = props;

    return createMode
        ? <PollCreate setCreateMode = { setCreateMode } />
        : <div className = 'polls-pane-content'>
            <div className = { 'poll-container' } >
                <PollsList />
            </div>
            <div className = 'poll-footer poll-create-footer poll-footer-wrap'>
                <Button
                    accessibilityLabel = { t('polls.create.create') }
                    autoFocus = { true }
                    fullWidth = { true }
                    labelKey = { 'polls.create.create' }
                    onClick = { onCreate } />
                <PollsDownload />
            </div>
        </div>;
};

/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
