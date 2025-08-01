import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { shouldShowModeratorSettings } from '../../functions.web';

import FollowMeButton from './FollowMeButton';

const FollowMeContainerButton = (props: AbstractButtonProps) => {
    const showModeratorSettings = useSelector((state: IReduxState) => shouldShowModeratorSettings(state));
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);

    // Only show the follow-me button if moderator settings should be shown and there's an active conference
    const shouldShowFollowMeButton = Boolean(conference && showModeratorSettings);

    return shouldShowFollowMeButton
        ? <FollowMeButton { ...props } />
        : null;
};

export default FollowMeContainerButton;
