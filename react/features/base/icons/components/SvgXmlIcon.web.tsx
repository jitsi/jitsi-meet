import React, { useMemo } from 'react';

/**
 * SVG rendering component.
 *
 * @returns {JSX.Element}
 */
const SvgXmlIcon = ({ src, ...rest }: {
    src: string;
}): JSX.Element => {
    const attributes = Object.entries(rest)
        .filter(([ , value ]) => value !== undefined)
        .map(([ key, value ]) => `${key}="${value}"`)
        .join(' ');

    // React replaces the inner HTML whenever the dangerouslySetInnerHTML object changes, so keep it
    // stable while the markup is the same. Otherwise every re-render swaps the svg element and
    // breaks anything holding a reference to it, like the outside click check of a popover.
    const markup = useMemo(() => {
        const svgDocument = new DOMParser().parseFromString(src, 'image/svg+xml');
        const element = svgDocument.documentElement.outerHTML;

        return { __html: element.replace('<svg', `<svg ${attributes}`) };
    }, [ src, attributes ]);

    return (
        <div // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML = { markup }
            { ...rest } />
    );
};

export default SvgXmlIcon;
