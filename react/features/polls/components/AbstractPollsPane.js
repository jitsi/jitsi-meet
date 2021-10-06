// @flow

import React, { useCallback, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isLocalParticipantModerator, getParticipantDisplayName } from '../../base/participants';
import { isPollsModerationEnabled, importPollsFromFile, exportPollsToFile } from '../functions';

/*
 * Props that will be passed by the AbstractPollsPane to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    createMode: boolean,
    isModerator: boolean,
    isModerationEnabled: boolean,
    onCreate: void => void,
    onImport: Function,
    onExport: Function,
    setCreateMode: boolean => void,
    t: Function,
};

/**
 * Higher Order Component taking in a concrete PollsPane component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollsPane = (Component: AbstractComponent<AbstractProps>) => () => {

    const [ createMode, setCreateMode ] = useState(false);
    const isModerator = useSelector(state => isLocalParticipantModerator(state));
    const isModerationEnabled = useSelector(state => isPollsModerationEnabled(state));
    const conference = useSelector(state => state['features/base/conference'].conference);
    const myName = useSelector(state => getParticipantDisplayName(state, conference.myUserId()));
    const polls = useSelector(state => state['features/polls']?.polls);

    const onCreate = () => {
        setCreateMode(true);
    };

    const onImport = useCallback((file: File) => {
        importPollsFromFile(file, conference, myName, isModerationEnabled);
    }, [ myName, isModerationEnabled, conference ]);

    const onExport = useCallback(() => {
        exportPollsToFile(polls);
    }, [ polls ]);

    const { t } = useTranslation();

    return (<Component
        createMode = { createMode }
        isModerationEnabled = { isModerationEnabled }
        isModerator = { isModerator }
        /* eslint-disable react/jsx-no-bind */
        onCreate = { onCreate }
        onExport = { onExport }
        onImport = { onImport }
        setCreateMode = { setCreateMode }
        t = { t } />);

};

export default AbstractPollsPane;
