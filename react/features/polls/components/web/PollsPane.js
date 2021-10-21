// @flow

import DownloadIcon from '@atlaskit/icon/glyph/download';
import UploadIcon from '@atlaskit/icon/glyph/upload';
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

    const fileInputRef = useRef(null);

    const startFileUpload = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [ fileInputRef ]);

    const onFileUpload = useCallback(e => {
        if (e?.target?.files?.length === 1) {
            onImport(e.target.files[0]);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [ fileInputRef ]);

    return createMode
        ? <PollCreate setCreateMode = { setCreateMode } />
        : <div className = 'polls-pane-content'>
            <div className = { 'poll-container' } >
                <PollsList />
            </div>

            <div className = { 'poll-footer poll-create-footer' }>
                { !isModerationEnabled || isModerator ? <button
                    aria-label = { t('polls.create.create') }
                    className = 'poll-button poll-button-primary'
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { onCreate } >
                    <span>{t('polls.create.create')}</span>
                </button> : null }
                { isModerationEnabled && isModerator ? <>
                    <button
                        aria-label = { t('polls.moderation.export') }
                        className = 'poll-button poll-button-secondary poll-button-icon'
                        onClick = { onExport }
                        type = 'button' >
                        <DownloadIcon label = { t('polls.moderation.export') } />
                    </button>
                    <button
                        aria-label = { t('polls.moderation.import') }
                        className = 'poll-button poll-button-secondary poll-button-icon'
                        onClick = { startFileUpload }
                        type = 'button' >
                        <UploadIcon label = { t('polls.moderation.import') } />
                        <input
                            accept = '.json'
                            hidden = { true }
                            onChange = { onFileUpload }
                            ref = { fileInputRef }
                            type = 'file' />
                    </button>
                </> : null }
            </div>
        </div>;
};

/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
