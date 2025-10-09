import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconExclamationTriangle } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { COLORS } from '../../../base/label/constants';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import getUnsafeRoomText from '../../../base/util/getUnsafeRoomText.web';
import useInsecureRoomName from '../../../base/util/useInsecureRoomName';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions.web';

interface IProps {
    room: string | undefined;
    t: Function;
    unsafeRoomWarningEnabled: boolean;
}

/**
 * Renders a label indicating that we are in a room with an insecure name.
 *
 * @returns {JSX.Element|null} The insecure room name label component or null if not insecure.
 */
function InsecureRoomNameLabel({ room, unsafeRoomWarningEnabled, t }: IProps) {
    const isInsecure = useInsecureRoomName(room || '', unsafeRoomWarningEnabled);

    if (!isInsecure) {
        return null;
    }

    return (
        <Tooltip
            content = { getUnsafeRoomText(t, 'meeting') }
            position = 'bottom'>
            <Label
                color = { COLORS.red }
                icon = { IconExclamationTriangle } />
        </Tooltip>
    );
}

function mapStateToProps(state: any) {
    const { locked, room } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];

    return {
        room,
        unsafeRoomWarningEnabled: Boolean(isUnsafeRoomWarningEnabled(state)
            && room
            && !(lobbyEnabled || Boolean(locked)))
    };
}

export default translate(connect(mapStateToProps)(InsecureRoomNameLabel));
