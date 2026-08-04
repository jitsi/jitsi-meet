import React, { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import Avatar from '../../base/avatar/components/Avatar';
import { getParticipantDisplayName, isScreenShareParticipantById } from '../../base/participants/functions';
import { setSecondScreen } from '../actions.web';
import { resolveSource } from '../functions.web';
import { useDominantSpeakerId, useSecondScreenParticipantIds } from '../hooks.web';
import { ISecondScreenSource } from '../types';

import SecondScreenStageTile from './SecondScreenStageTile';
import SecondScreenVideo from './SecondScreenVideo';

/**
 * The type of the React {@code Component} props of {@link SecondScreenStage}.
 */
interface IProps {

    /**
     * The id of the second-screen window this layout renders into.
     */
    id: string;

    /**
     * The second-screen window, needed to render tracks in its own realm.
     */
    win: Window;
}

/**
 * The avatar size, in pixels, for a camera-off featured participant.
 */
const FEATURED_AVATAR_SIZE = 160;

/**
 * The styles, injected into the second window via its own Emotion cache.
 */
const useStyles = makeStyles()(() => {
    return {
        stage: {
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            backgroundColor: '#292929',
            overflow: 'hidden'
        },
        main: {
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            minHeight: 0
        },
        avatar: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(-50%, -50%)'
        },
        nameOverlay: {
            position: 'absolute',
            bottom: 16,
            left: '50%',
            maxWidth: '50%',
            padding: '6px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 3,
            color: '#fff',
            fontSize: 13,
            lineHeight: '18px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transform: 'translateX(-50%)'
        },
        filmstrip: {
            boxSizing: 'border-box',
            width: 188,
            flexShrink: 0,
            overflow: 'hidden'
        },
        filmstripInner: {
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 8,
            backgroundColor: '#040404',
            overflowX: 'hidden',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
                width: 8
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4
            }
        }
    };
});

/**
 * Re-renders the featured area only when the resolved track or participant
 * actually changes, not on every unrelated redux update.
 *
 * @param {Object} a - The previous resolved source.
 * @param {Object} b - The next resolved source.
 * @returns {boolean}
 */
const _featuredEquals = (a: ReturnType<typeof resolveSource>, b: ReturnType<typeof resolveSource>) =>
    a.track === b.track && a.participant === b.participant;

/**
 * The stage layout for a second-screen window: one participant (or shared screen)
 * featured large, with a filmstrip of everyone down the side. The featured
 * participant follows the source ({@code role: 'stage'} tracks the active speaker;
 * {@code participant: X} pins X). Clicking a filmstrip tile re-pins through the
 * external API ({@code setSecondScreen}), so the API stays the single control
 * plane. All video is rendered via the realm-safe {@link SecondScreenVideo} clone
 * leaf, never {@code VideoTrack} (whose attach would cross window realms).
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenStage = ({ id, win }: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const store = useStore<IReduxState>();

    const source = useSelector((state: IReduxState) => state['features/multi-screen'].screens[id]?.source);
    const screenId = useSelector((state: IReduxState) => state['features/multi-screen'].screens[id]?.screenId);
    const { participant: featured, track } = useSelector(
        (state: IReduxState) => (source ? resolveSource(state, source) : { participant: undefined, track: null }),
        _featuredEquals);

    const featuredId = featured?.id;
    const name = useSelector((state: IReduxState) => (featuredId ? getParticipantDisplayName(state, featuredId) : ''));

    const participantIds = useSecondScreenParticipantIds();
    const dominantSpeakerId = useDominantSpeakerId();

    const pinnedId = source?.participant ?? null;
    const hasFilmstrip = participantIds.length > 1;

    const _onSelect = useCallback((participantId: string) => {
        let next: ISecondScreenSource;

        if (pinnedId === participantId) {
            next = { role: 'stage' };
        } else if (isScreenShareParticipantById(store.getState(), participantId)) {
            next = { media: 'desktop', participant: participantId };
        } else {
            next = { media: 'camera', participant: participantId };
        }

        dispatch(setSecondScreen(id, next, screenId));
    }, [ dispatch, id, pinnedId, screenId, store ]);

    return (
        <div className = { classes.stage }>
            <div className = { classes.main }>
                { track ? (
                    <SecondScreenVideo
                        track = { track }
                        win = { win } />
                ) : (
                    <div className = { classes.avatar }>
                        <Avatar
                            participantId = { featuredId }
                            size = { FEATURED_AVATAR_SIZE } />
                    </div>
                ) }
                { name && (
                    <div className = { classes.nameOverlay }>
                        { name }
                    </div>
                ) }
            </div>
            { hasFilmstrip && (
                <div className = { classes.filmstrip }>
                    <div className = { classes.filmstripInner }>
                        { participantIds.map(pid => (
                            <SecondScreenStageTile
                                isActiveSpeaker = { pid === dominantSpeakerId }
                                key = { pid }
                                onSelect = { _onSelect }
                                participantId = { pid }
                                pinned = { pid === pinnedId }
                                win = { win } />
                        )) }
                    </div>
                </div>
            ) }
        </div>
    );
};

export default SecondScreenStage;
