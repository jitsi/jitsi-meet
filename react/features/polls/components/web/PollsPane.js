// @flow

import React, { useCallback, useRef } from 'react';

import AbstractPollsPane from '../AbstractPollsPane';
import type { AbstractProps } from '../AbstractPollsPane';

import PollsList from './PollsList';

import { PollCreate } from '.';

const PollsPane = (props: AbstractProps) => {

    const {
        createMode,
        isModerationEnabled,
        isModerator,
        onCreate,
        setCreateMode,
        onExport,
        onImport,
        t
    } = props;

    const fileInputRef = useRef();

    const startFileUpload = useCallback(() => {
        if (fileInputRef?.current) {
            fileInputRef.current.click();
        }
    }, []);

    const onFileUpload = useCallback(e => {
        if (e?.target?.files?.length === 1) {
            onImport(e.target.files[0]);

            fileInputRef.current.value = null;
        }
    }, []);

    return createMode
        ? <PollCreate setCreateMode = { setCreateMode } />
        : <div className = 'polls-pane-content'>
            <div className = { 'poll-container' } >
                <PollsList />
            </div>
            { isModerationEnabled && isModerator ? <div className = { 'poll-footer' }>
                <button
                    aria-label = { t('polls.moderation.export') }
                    className = 'poll-small-secondary-button'
                    onClick = { onExport }
                    type = 'button' >
                    <span>{t('polls.moderation.export')}</span>
                </button>
                <button
                    aria-label = { t('polls.moderation.import') }
                    className = 'poll-small-secondary-button'
                    onClick = { startFileUpload }
                    type = 'button' >
                    <span>{t('polls.moderation.import')}</span>
                    <input
                        accept = '.json'
                        hidden = { true }
                        onChange = { onFileUpload }
                        ref = { fileInputRef }
                        type = 'file' />
                </button>
            </div> : null }
            <div className = { 'poll-footer' }>
                { !isModerationEnabled || isModerator ? <button
                    aria-label = { t('polls.create.create') }
                    className = { 'poll-primary-button' }
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { onCreate } >
                    <span>{t('polls.create.create')}</span>
                </button> : null }
            </div>
        </div>;
};

/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
