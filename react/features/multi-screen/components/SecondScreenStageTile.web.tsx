import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import Icon from '../../base/icons/components/Icon';
import { IconPin } from '../../base/icons/svg';
import { getParticipantDisplayName } from '../../base/participants/functions';

import SecondScreenTile from './SecondScreenTile';

/**
 * The type of the React {@code Component} props of {@link SecondScreenStageTile}.
 */
interface IProps {

    /**
     * Whether this participant is the dominant speaker (drives the speaking ring).
     */
    isActiveSpeaker: boolean;

    /**
     * Called with this tile's participant id when it is clicked, to feature it on
     * the stage (or unfeature it when it is already pinned).
     */
    onSelect: (participantId: string) => void;

    /**
     * The id of the participant (a person or a virtual screenshare) this tile
     * previews and pins to the stage on click.
     */
    participantId: string;

    /**
     * Whether this participant is explicitly pinned to the stage (shows the pin
     * badge; a click then unpins).
     */
    pinned: boolean;

    /**
     * The second-screen window, needed to render a track in its own realm.
     */
    win: Window;
}

/**
 * The filmstrip tile width and height in pixels (16:9).
 */
const TILE_WIDTH = 160;
const TILE_HEIGHT = 90;

/**
 * The styles, injected into the second window via its own Emotion cache.
 */
const useStyles = makeStyles()(() => {
    return {
        item: {
            position: 'relative',
            flexShrink: 0,
            padding: 0,
            background: 'none',
            border: '2px solid transparent',
            borderRadius: 6,
            cursor: 'pointer',
            lineHeight: 0,
            transition: 'border-color 0.2s ease',
            '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.4)'
            }
        },
        pin: {
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 4,
            color: '#fff',
            lineHeight: 0,
            pointerEvents: 'none'
        }
    };
});

/**
 * A clickable filmstrip tile in the second-screen stage layout: the shared {@link
 * SecondScreenTile} wrapped in a button that pins the participant to the stage by
 * dispatching {@code setSecondScreen} through the external-API control plane
 * (handled by the parent's {@code onSelect}). A pin badge marks the pinned tile;
 * clicking it again unpins. Memoized so a dominant-speaker or pin change only
 * re-renders the affected tiles.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenStageTile = ({ isActiveSpeaker, onSelect, participantId, pinned, win }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const name = useSelector((state: IReduxState) => getParticipantDisplayName(state, participantId));

    const _onClick = useCallback(() => {
        onSelect(participantId);
    }, [ onSelect, participantId ]);

    return (
        <button
            aria-label = { t(pinned ? 'multiScreen.unpinFromStage' : 'multiScreen.showOnStage', { name }) }
            aria-pressed = { pinned }
            className = { classes.item }
            onClick = { _onClick }
            type = 'button'>
            <SecondScreenTile
                height = { TILE_HEIGHT }
                isActiveSpeaker = { isActiveSpeaker }
                participantId = { participantId }
                width = { TILE_WIDTH }
                win = { win } />
            { pinned && (
                <span className = { classes.pin }>
                    <Icon
                        color = '#fff'
                        size = { 14 }
                        src = { IconPin } />
                </span>
            ) }
        </button>
    );
};

export default React.memo(SecondScreenStageTile);
