// @flow

import React from 'react';

import { Icon, IconRaisedHandHollow } from '../../base/icons';

import { RaisedHandIndicatorBackground } from './styled';

export const RaisedHandIndicator = () => (
    <RaisedHandIndicatorBackground>
        <Icon
            size = { 15 }
            src = { IconRaisedHandHollow } />
    </RaisedHandIndicatorBackground>
);
