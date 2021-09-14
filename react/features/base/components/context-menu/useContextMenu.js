// @flow

import { useCallback, useRef, useState } from 'react';

import { findAncestorByClass } from '../../../participants-pane/functions';

type NullProto = {
    [key: string]: any,
    __proto__: null
};

type RaiseContext = NullProto | {|

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement,

    /**
     * The entity for which the menu is context menu is raised.
     */
    entity?: string | Object,
|};

const initialState = Object.freeze(Object.create(null));

const useContextMenu = () => {
    const [ raiseContext, setRaiseContext ] = useState < RaiseContext >(initialState);
    const isMouseOverMenu = useRef(false);

    const lowerMenu = useCallback((force: boolean | Object = false) => {
        /**
         * We are tracking mouse movement over the active participant item and
         * the context menu. Due to the order of enter/leave events, we need to
         * defer checking if the mouse is over the context menu with
         * queueMicrotask.
         */
        window.queueMicrotask(() => {
            if (isMouseOverMenu.current && !(force === true)) {
                return;
            }

            if (raiseContext !== initialState) {
                setRaiseContext(initialState);
            }
        });
    }, [ raiseContext ]);

    const raiseMenu = useCallback((entity: string | Object, target: EventTarget) => {
        setRaiseContext({
            entity,
            offsetTarget: findAncestorByClass(target, 'list-item-container')
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback((entity: string | Object) => (e: MouseEvent) => {
        e.stopPropagation();
        const { entity: raisedEntity } = raiseContext;

        if (raisedEntity && raisedEntity === entity) {
            lowerMenu();
        } else {
            raiseMenu(entity, e.target);
        }
    }, [ raiseContext ]);

    const menuEnter = useCallback(() => {
        isMouseOverMenu.current = true;
    }, []);

    const menuLeave = useCallback(() => {
        isMouseOverMenu.current = false;
        lowerMenu();
    }, [ lowerMenu ]);

    return [ lowerMenu, raiseMenu, toggleMenu, menuEnter, menuLeave, raiseContext ];
};

export default useContextMenu;
