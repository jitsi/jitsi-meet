import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getParticipantDisplayName, isScreenShareParticipant } from '../../../base/participants/functions';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { isLayoutTileView } from '../../../video-layout/functions.any';
import { shouldDisplayStageParticipantBadge } from '../../functions';

/**
 * Component that renders the dominant speaker's name as a badge above the toolbar in stage view.
 *
 * @returns {ReactElement|null}
 */
const StageParticipantNameLabel = () => {
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const selectedId = largeVideoParticipant?.id;
    const nameToDisplay = useSelector((state: IReduxState) => getParticipantDisplayName(state, selectedId ?? ''));
    const toolboxVisible: boolean = useSelector(isToolboxVisible);
    const visible = useSelector(shouldDisplayStageParticipantBadge);
    const isTileView = useSelector(isLayoutTileView);
    const _isScreenShareParticipant = isScreenShareParticipant(largeVideoParticipant);

    if (!visible && !(_isScreenShareParticipant && !isTileView)) {
        return null;
    }

    // Internxt custom Tailwind design
    return (
        <div className={`absolute left-4 px-3 py-2 bg-black/50 flex justify-between items-center space-x-2 rounded-[20px] transition-all duration-300 ${
            toolboxVisible ? 'bottom-20' : 'bottom-4'
        } ${_isScreenShareParticipant ? 'opacity-100' : 'opacity-100'}`}>
            {nameToDisplay}
        </div>
    );
};

export default StageParticipantNameLabel;
