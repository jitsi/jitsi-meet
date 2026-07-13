import { CacheProvider } from '@emotion/react';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { ISecondScreenHandle } from '../functions.web';

import SecondScreenView from './SecondScreenView';

/**
 * An open second-screen window paired with its portal root.
 */
interface IOpenScreen {
    handle: ISecondScreenHandle;
    id: string;
}

/**
 * Renders every open second-screen window's content into that window via a React
 * portal. Mounted once in the conference, it observes the multi-screen redux
 * state and (un)mounts a {@link SecondScreenView} per window as windows open and
 * close. Because the windows are same-origin, React reconciles their DOM the same
 * way it does the main document, so the second screens can host any component
 * (avatars now, with layouts and a whiteboard later), not just a {@code <video>}.
 * Each window's subtree is wrapped in its own Emotion {@code CacheProvider} (the
 * cache's container is that window's head), so MUI/tss-react styles inject into
 * the window directly, in dev and prod.
 *
 * @returns {ReactElement}
 */
const SecondScreenPortals = () => {
    const screens = useSelector((state: IReduxState) => state['features/multi-screen'].screens);

    const open = useMemo(() => Object.keys(screens).reduce<Array<IOpenScreen>>((acc, id) => {
        const handle = screens[id].handle as ISecondScreenHandle | undefined;

        if (handle?.root && !handle.win.closed) {
            acc.push({ handle, id });
        }

        return acc;
    }, []), [ screens ]);

    return (
        <>
            { open.map(({ handle, id }) => ReactDOM.createPortal(
                <CacheProvider value = { handle.cache }>
                    <SecondScreenView
                        id = { id }
                        win = { handle.win } />
                </CacheProvider>,
                handle.root,
                id
            )) }
        </>
    );
};

export default SecondScreenPortals;
