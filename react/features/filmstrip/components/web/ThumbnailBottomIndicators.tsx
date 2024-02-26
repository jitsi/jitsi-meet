import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import {
    isDisplayNameVisible,
    isNameReadOnly
} from '../../../base/config/functions.any';
import { isScreenShareParticipantById } from '../../../base/participants/functions';
import DisplayName from '../../../display-name/components/web/DisplayName';

import StatusIndicators from './StatusIndicators';

interface IProps {

    /**
     * Class name for indicators container.
     */
    className?: string;

    /**
     * Whether or not the indicators are for the local participant.
     */
    local: boolean;

    /**
     * Id of the participant for which the component is displayed.
     */
    participantId: string;

    /**
     * Whether or not to show the status indicators.
     */
    showStatusIndicators?: boolean;

    /**
     * The type of thumbnail.
     */
    thumbnailType?: string;
}

const useStyles = makeStyles()(() => {
    return {
        nameContainer: {
            display: 'flex',
            overflow: 'hidden',

            '&>div': {
                display: 'flex',
                overflow: 'hidden'
            }
        }
    };
});

const ThumbnailBottomIndicators = ({
    className,
    local,
    participantId,
    showStatusIndicators = true,
    thumbnailType
}: IProps) => {
    const { classes: styles, cx } = useStyles();
    const _allowEditing = !useSelector(isNameReadOnly);
    const _defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
    const _showDisplayName = useSelector(isDisplayNameVisible);
    const isVirtualScreenshareParticipant = useSelector(
        (state: IReduxState) => isScreenShareParticipantById(state, participantId)
    );

    return (<div className = { cx(className, 'bottom-indicators') }>
        {
            showStatusIndicators && <StatusIndicators
                audio = { !isVirtualScreenshareParticipant }
                moderator = { true }
                participantID = { participantId }
                screenshare = { isVirtualScreenshareParticipant }
                thumbnailType = { thumbnailType } />
        }
        {
            _showDisplayName && (
                <span className = { styles.nameContainer }>
                    <DisplayName
                        allowEditing = { local ? _allowEditing : false }
                        displayNameSuffix = { local ? _defaultLocalDisplayName : '' }
                        elementID = { local ? 'localDisplayName' : `participant_${participantId}_name` }
                        participantID = { participantId }
                        thumbnailType = { thumbnailType } />
                </span>
            )
        }
    </div>);
};

export default ThumbnailBottomIndicators;
