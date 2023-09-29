import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';

import SvgXmlIcon from './SvgXmlIcon';

/**
 * Icon wrapper that checks for branding before returning the SVG component.
 *
 * @returns {JSX.Element}
 */
const withBranding = ({ DefaultIcon, iconName }: {
    DefaultIcon: any;
    iconName: string;
}) => (props: any) => {
    const src = useSelector((state: IReduxState) =>
        state['features/dynamic-branding']?.brandedIcons?.[iconName]
    );

    if (src) {
        return (
            <SvgXmlIcon
                src = { src }
                { ...props } />
        );
    }

    return <DefaultIcon { ...props } />;
};

export default withBranding;
