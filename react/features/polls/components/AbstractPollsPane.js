// @flow

import React, { useCallback, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isLocalParticipantModerator, getParticipantDisplayName } from '../../base/participants';
import { COMMAND_NEW_POLLS } from '../constants';
import { isPollsModerationEnabled, getNewPollId } from '../functions';

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
    const myId = conference.myUserId();
    const myName = useSelector(state => getParticipantDisplayName(state, myId));

    const onCreate = () => {
        setCreateMode(true);
    };

    const onImport = useCallback((file: File) => {
        if (file) {
            const reader = new FileReader();

            reader.readAsText(file);

            reader.onload = event => {
                if (event?.target?.result) {
                    console.log('event?.target?.result xxxxx: ', event?.target?.result);
                    const pollsData = JSON.parse(event?.target?.result);

                    if (pollsData?.length) {
                        const newPollsData = pollsData
                            .filter(poll => poll.question && poll.answers.length > 2)
                            .map(poll => {
                                return {
                                    ...poll,
                                    pollId: getNewPollId(),
                                    senderId: myId,
                                    senderName: myName,
                                    hidden: isModerationEnabled
                                };
                            });

                        conference.sendMessage({
                            type: COMMAND_NEW_POLLS,
                            polls: newPollsData
                        });
                    }
                }
            };
        }
    }, [ myId, myName, isModerationEnabled ]);

    const onExport = useCallback(() => {
        console.log('2 xxxxx: ', 2);
    }, []);

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
