import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../functions.web';

import RaiseHandButton from './RaiseHandButton';
import ReactionsMenuButton from './ReactionsMenuButton';

const RaiseHandContainerButton = (props: AbstractButtonProps) => {
    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const isNarrowLayout = useSelector((state: IReduxState) => state['features/base/responsive-ui'].isNarrowLayout);
    const showReactionsAsPartOfRaiseHand
        = _shouldDisplayReactionsButtons && !reactionsButtonEnabled && !isNarrowLayout && !isMobileBrowser();

    return showReactionsAsPartOfRaiseHand
        ? <ReactionsMenuButton
            { ...props }
            showRaiseHand = { true } />
        : <RaiseHandButton { ...props } />;
};

export default RaiseHandContainerButton;
