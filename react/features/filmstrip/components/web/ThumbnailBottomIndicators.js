// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { isDisplayNameVisible, isNameReadOnly } from '../../../base/config/functions.any';
import DisplayName from '../../../display-name/components/web/DisplayName';
import { THUMBNAIL_TYPE } from '../../constants';

import StatusIndicators from './StatusIndicators';

declare var interfaceConfig: Object;

type Props = {

    /**
     * Class name for indicators container.
     */
    className: string,

    /**
     * Whether or not the indicators are for the local participant.
     */
    local: boolean,

    /**
     * Id of the participant for which the component is displayed.
     */
    participantId: string,

    /**
     * Whether or not to show the status indicators.
     */
    showStatusIndicators: string,

    /**
     * The type of thumbnail.
     */
    thumbnailType: string
}

const useStyles = makeStyles(() => {
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
    const styles = useStyles();
    const _allowEditing = !useSelector(isNameReadOnly);
    const _defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
    const _showDisplayName = useSelector(isDisplayNameVisible);

    return (<div className = { className }>
        {
            showStatusIndicators && <StatusIndicators
                audio = { true }
                moderator = { true }
                participantID = { participantId }
                screenshare = { thumbnailType === THUMBNAIL_TYPE.TILE }
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
