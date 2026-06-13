import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { getDominantSpeakerParticipant, getLocalParticipant } from '../../base/participants/functions';
import { SECONDARY_LAYOUTS } from '../constants';
import { getSecondaryLayout } from '../functions';

import ActiveSpeakerView from './ActiveSpeakerView';
import GalleryView from './GalleryView';
import SecondaryToolbar from './SecondaryToolbar';

/**
 * The main UI component rendered inside the secondary browser window.
 *
 * Renders either the Active Speaker (stage) view — which mirrors the main
 * window's large video — or the Gallery view, plus the toolbar. Each view is
 * mounted only while its layout is active.
 *
 * @returns {React.ReactElement}
 */
const SecondaryConference: React.FC = () => {
    const currentLayout = useSelector(
        (state: IReduxState) => getSecondaryLayout(state)
    );

    // Participant membership is driven by the filmstrip's remoteParticipants
    // array, which is reassigned immutably on join/leave. The base participants
    // Map is mutated in place, so selecting it directly would never trigger a
    // re-render when someone joins or leaves.
    const localParticipant = useSelector(
        (state: IReduxState) => getLocalParticipant(state)
    );
    const remoteParticipantIds = useSelector(
        (state: IReduxState) => state['features/filmstrip'].remoteParticipants
    );

    // The conference dominant speaker drives the gallery's speaking ring,
    // mirroring the main window's thumbnail indicator (one tile at a time).
    const dominantSpeakerId = useSelector(
        (state: IReduxState) => getDominantSpeakerParticipant(state)?.id ?? null
    );

    // Ordered list of participant IDs to display (local first, then remotes).
    const participantIds = useMemo(() => {
        const ids: string[] = [];

        if (localParticipant?.id) {
            ids.push(localParticipant.id);
        }

        return ids.concat(remoteParticipantIds);
    }, [ localParticipant?.id, remoteParticipantIds ]);

    return (
        <div className = 'multi-screen-container'>
            { currentLayout === SECONDARY_LAYOUTS.ACTIVE_SPEAKER
                ? <ActiveSpeakerView />
                : <GalleryView
                    dominantSpeakerId = { dominantSpeakerId }
                    participantIds = { participantIds } /> }
            <SecondaryToolbar />
        </div>
    );
};

export default SecondaryConference;
