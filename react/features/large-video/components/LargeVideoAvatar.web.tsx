import React from 'react';
import { useSelector } from 'react-redux';

import Avatar from '../../base/avatar/components/Avatar';
import { isStageParticipantNameLabelRendered } from '../../display-name/functions';

/**
 * The size of the avatar shown on the stage when the participant has no video.
 */
const AVATAR_SIZE = 200;

/**
 * The type of the React {@code Component} props of {@link LargeVideoAvatar}.
 */
interface IProps {

    /**
     * The ID of the participant shown on the stage.
     */
    participantId?: string;
}

/**
 * Renders the avatar of the participant on the stage. The avatar announces the participant's name to assistive
 * technologies only while the stage name label is not rendered (local participant on stage, display names turned
 * off, no name to show): when the label is in the DOM it already reads the same name, even while faded out, and
 * announcing it from the avatar as well would make screen readers read it twice.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const LargeVideoAvatar = ({ participantId }: IProps) => {
    const nameLabelRendered = useSelector(isStageParticipantNameLabelRendered);

    return (
        <Avatar
            accessibilityAnnounceName = { !nameLabelRendered }
            id = 'dominantSpeakerAvatar'
            participantId = { participantId }
            size = { AVATAR_SIZE } />
    );
};

export default LargeVideoAvatar;
