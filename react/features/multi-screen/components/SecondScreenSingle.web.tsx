import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import Avatar from '../../base/avatar/components/Avatar';
import { IParticipant } from '../../base/participants/types';
import { resolveSource } from '../functions.web';

import SecondScreenVideo from './SecondScreenVideo';

/**
 * The type of the React {@code Component} props of {@link SecondScreenSingle}.
 */
interface IProps {

    /**
     * The id of the second-screen window this view renders into.
     */
    id: string;

    /**
     * The second-screen window, needed to render a track in its own realm.
     */
    win: Window;
}

/**
 * The resolved source: the meeting track to show (or {@code null}) and the
 * participant backing it (for the avatar fallback).
 */
interface IResolved {
    participant?: IParticipant;
    track: MediaStreamTrack | null;
}

/**
 * The size of the fallback avatar shown when the source has no live video.
 */
const AVATAR_SIZE = 200;

/**
 * Full-bleed, centered style for the avatar fallback on black.
 */
const CONTAINER_STYLE: React.CSSProperties = {
    alignItems: 'center',
    background: '#000',
    display: 'flex',
    height: '100%',
    inset: 0,
    justifyContent: 'center',
    position: 'fixed',
    width: '100%'
};

/**
 * Re-renders only when the resolved track or backing participant actually
 * changes, not on every unrelated redux update.
 *
 * @param {IResolved} a - The previous resolved source.
 * @param {IResolved} b - The next resolved source.
 * @returns {boolean}
 */
const _resolvedEquals = (a: IResolved, b: IResolved) => a.track === b.track && a.participant === b.participant;

/**
 * Renders the single-source second-screen case: the resolved meeting track
 * full-bleed (via {@link SecondScreenVideo}), falling back to the backing
 * participant's avatar when there is no live video. Kept separate from
 * {@link SecondScreenView} so the {@code resolveSource} selector only runs for this
 * fall-through case, not for the tile/stage layouts that resolve their own state.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenSingle = ({ id, win }: IProps) => {
    const source = useSelector((state: IReduxState) => state['features/multi-screen'].screens[id]?.source);
    const { participant, track } = useSelector(
        (state: IReduxState): IResolved =>
            (source ? resolveSource(state, source) : { participant: undefined, track: null }),
        _resolvedEquals);

    if (track) {
        return (
            <SecondScreenVideo
                track = { track }
                win = { win } />
        );
    }

    return (
        <div style = { CONTAINER_STYLE }>
            <Avatar
                participantId = { participant?.id }
                size = { AVATAR_SIZE } />
        </div>
    );
};

export default SecondScreenSingle;
