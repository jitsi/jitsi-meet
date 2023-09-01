import React, { useMemo } from 'react';

/**
 * SVG rendering component.
 *
 * @returns {JSX.Element}
 */
const SvgXmlIcon = ({ src, ...rest }: {
    src: string;
}): JSX.Element => {
    const svgDocument = new DOMParser().parseFromString(src, 'image/svg+xml');
    const element = svgDocument.documentElement.outerHTML;
    const attributes = useMemo(() => Object.entries(rest).map(
        ([ key, value ]) => `${key}="${value}"`)
    .join(' '), [ rest ]);

    const html = element.replace('<svg', `<svg ${attributes}`);

    return (
        <div // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML = {{ __html: html }}
            { ...rest } />
    );
};

export default SvgXmlIcon;
