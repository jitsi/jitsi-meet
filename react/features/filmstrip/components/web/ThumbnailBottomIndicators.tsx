/* eslint-disable lines-around-comment */

import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import {
    getMultipleVideoSupportFeatureFlag,
    isDisplayNameVisible,
    isNameReadOnly
} from '../../../base/config/functions.any';
import { isScreenShareParticipantById } from '../../../base/participants/functions';
import DisplayName from '../../../display-name/components/web/DisplayName';
import { THUMBNAIL_TYPE } from '../../constants';

// @ts-ignore
import StatusIndicators from './StatusIndicators';

declare let interfaceConfig: any;

type Props = {

    /**
     * Class name for indicators container.
     */
    className: string;

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
    thumbnailType: string;
};

const useStyles = makeStyles()(() => {
    return {
        nameContainer: {
            display: 'flex',
            overflow: 'hidden',
            padding: '2px 0',

            '&>div': {
                display: 'flex',
                overflow: 'hidden'
            },

            '&:first-child': {
                marginLeft: '6px'
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
}: Props) => {
    const { classes: styles } = useStyles();
    const _allowEditing = !useSelector(isNameReadOnly);
    const _defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
    const _isMultiStreamEnabled = useSelector(getMultipleVideoSupportFeatureFlag);
    const _showDisplayName = useSelector(isDisplayNameVisible);
    const isVirtualScreenshareParticipant = useSelector(
        (state: IReduxState) => isScreenShareParticipantById(state, participantId)
    );

    return (<div className = { className }>
        {
            showStatusIndicators && <StatusIndicators
                audio = { !isVirtualScreenshareParticipant }
                moderator = { true }
                participantID = { participantId }
                screenshare = { _isMultiStreamEnabled
                    ? isVirtualScreenshareParticipant
                    : thumbnailType === THUMBNAIL_TYPE.TILE }
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
