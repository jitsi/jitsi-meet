import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';

import SecondScreenGallery from './SecondScreenGallery';
import SecondScreenSingle from './SecondScreenSingle';
import SecondScreenStage from './SecondScreenStage';
import SecondScreenWhiteboard from './SecondScreenWhiteboard';

/**
 * The type of the React {@code Component} props of {@link SecondScreenView}.
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
 * Routes a single second-screen window to a layout from its redux source
 * descriptor. A {@code whiteboard} source renders the {@link SecondScreenWhiteboard}
 * iframe; a {@code tile} source renders the {@link SecondScreenGallery} grid; a
 * stage or participant source renders the {@link SecondScreenStage} layout
 * (featured participant plus filmstrip); any other source renders the single
 * track/avatar via {@link SecondScreenSingle}. Each layout resolves its own state,
 * so the potentially expensive {@code resolveSource} selector only runs where it is
 * needed. Portaled into the second window by {@link SecondScreenPortals}.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenView = ({ id, win }: IProps) => {
    const source = useSelector((state: IReduxState) => state['features/multi-screen'].screens[id]?.source);

    if (source?.role === 'whiteboard') {
        return <SecondScreenWhiteboard />;
    }

    if (source?.role === 'tile') {
        return (
            <SecondScreenGallery
                win = { win } />
        );
    }

    if (source && (source.role === 'stage' || Boolean(source.participant))) {
        return (
            <SecondScreenStage
                id = { id }
                win = { win } />
        );
    }

    return (
        <SecondScreenSingle
            id = { id }
            win = { win } />
    );
};

export default SecondScreenView;
