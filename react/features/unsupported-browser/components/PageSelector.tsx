import React from 'react';
import { useSelector } from 'react-redux';

import { isVpaasMeeting } from '../../jaas/functions';

import JaasUnsupportedDesktopBrowser from './JaasUnsupportedDesktopBrowser';
import UnsupportedDesktopBrowser from './UnsupportedDesktopBrowser';

const PageSelector = () => {
    const isJaas = useSelector(isVpaasMeeting);

    if (isJaas) {
        return <JaasUnsupportedDesktopBrowser />;
    }

    return <UnsupportedDesktopBrowser />;
};

export default PageSelector;
