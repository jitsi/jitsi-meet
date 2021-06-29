// @flow
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';


import { openDialog } from '../../base/dialog';
import { getParticipants } from '../../base/participants';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { Drawer, DrawerPortal } from '../../toolbox/components/web';
import { showOverflowDrawer } from '../../toolbox/functions';
import MuteRemoteParticipantDialog from '../../video-menu/components/web/MuteRemoteParticipantDialog';
import { findAncestorWithClass, shouldRenderInviteButton, useDrawer } from '../functions';

import ContextMenuActions from './ContextMenuActions';
import { InviteButton } from './InviteButton';
import { MeetingParticipantContextMenu } from './MeetingParticipantContextMenu';
import { MeetingParticipantItem } from './MeetingParticipantItem';

type NullProto = {
  [key: string]: any,
  __proto__: null
};

const participantClassName = 'ptp-item';

type RaiseContext = NullProto | {

  /**
   * Target elements against which positioning calculations are made
   */
  offsetTarget?: HTMLElement,

  /**
   * Participant reference
   */
  participant?: Object,
};

const initialState = Object.freeze(Object.create(null));

const useStyles = makeStyles(theme => {
    return {
        heading: {
            color: theme.palette.text02,
            margin: '8px 0 16px',
            ...withPixelLineHeight(theme.typography.heading7)
        }
    };
});

export const MeetingParticipantList = () => {
    const dispatch = useDispatch();
    const isMouseOverMenu = useRef(false);
    const participants = useSelector(getParticipants, _.isEqual);
    const showInviteButton = useSelector(shouldRenderInviteButton);
    const [ raiseContext, setRaiseContext ] = useState<RaiseContext>(initialState);
    const [ clickedParticipant, setClickedParticipant ] = useState({});
    const overflowDrawer = useSelector(showOverflowDrawer);
    const [ drawerIsOpen, openDrawer, closeDrawer ] = useDrawer(false);
    const openDrawerForParticipant = useCallback(p => {
        setClickedParticipant(p);
        openDrawer();
    }, [ openDrawer, setClickedParticipant ]);
    const { t } = useTranslation();
    const classes = useStyles();

    const lowerMenu = useCallback(() => {
        /**
         * We are tracking mouse movement over the active participant item and
         * the context menu. Due to the order of enter/leave events, we need to
         * defer checking if the mouse is over the context menu with
         * queueMicrotask
         */
        window.queueMicrotask(() => {
            if (isMouseOverMenu.current) {
                return;
            }

            if (raiseContext !== initialState) {
                setRaiseContext(initialState);
            }
        });
    }, [ raiseContext ]);

    const raiseMenu = useCallback((participant, target) => {
        setRaiseContext({
            participant,
            offsetTarget: findAncestorWithClass(target, participantClassName)
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback(participant => e => {
        const { participant: raisedParticipant } = raiseContext;

        if (raisedParticipant && raisedParticipant === participant) {
            lowerMenu();
        } else {
            raiseMenu(participant, e.target);
        }
    }, [ raiseContext ]);

    const menuEnter = useCallback(() => {
        isMouseOverMenu.current = true;
    }, []);

    const menuLeave = useCallback(() => {
        isMouseOverMenu.current = false;
        lowerMenu();
    }, [ lowerMenu ]);

    const muteAudio = useCallback(id => () => {
        dispatch(openDialog(MuteRemoteParticipantDialog, { participantID: id }));
    });

    return (
    <>
        <div className = { classes.heading }>
            {t('participantsPane.headings.participantsList', { count: participants.length })}
        </div>
        {showInviteButton && <InviteButton />}
        <div>
            {participants.map(p => (
                <MeetingParticipantItem
                    className = { participantClassName }
                    isHighlighted = { raiseContext.participant === p }
                    key = { p.id }
                    muteAudio = { muteAudio }
                    onContextMenu = { toggleMenu(p) }
                    onLeave = { lowerMenu }
                    openDrawer = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participant = { p } />
            ))}
        </div>

        {!overflowDrawer
         && <MeetingParticipantContextMenu
             muteAudio = { muteAudio }
             onClick = { lowerMenu }
             onMouseEnter = { menuEnter }
             onMouseLeave = { menuLeave }
             { ...raiseContext } />
        }
        <DrawerPortal>
            <Drawer
                isOpen = { drawerIsOpen }
                onClose = { closeDrawer }>
                <ContextMenuActions
                    muteAudio = { muteAudio }
                    overflowDrawer = { true }
                    participant = { clickedParticipant } />
            </Drawer>
        </DrawerPortal>
    </>
    );
};
