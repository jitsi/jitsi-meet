import React, { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';
import { Trans } from 'react-i18next';

import i18next from '../../i18next';

/**
 * The character which replaces "<" in the values of a translation while Trans parses it. It is in a Unicode private
 * use area, so it does not occur in normal text.
 */
const LESS_THAN_PLACEHOLDER = '\uE000';

interface IProps {

    /**
     * The elements for the index tags of the translation: "<0>text</0>" or "<0/>" is the first one.
     */
    components: ReactElement[];

    /**
     * The key of the translation.
     */
    i18nKey: string;

    /**
     * The interpolation values of the translation.
     */
    values?: { [name: string]: number | string | undefined; };
}

/**
 * Puts back the "<" characters of the values in the nodes Trans created.
 *
 * @param {ReactNode} node - The nodes.
 * @returns {ReactNode}
 */
function restoreLessThan(node: ReactNode): ReactNode {
    if (typeof node === 'string') {
        return node.split(LESS_THAN_PLACEHOLDER).join('<');
    }

    if (Array.isArray(node)) {
        return node.map(restoreLessThan);
    }

    if (isValidElement(node) && node.props.children) {
        return cloneElement(node, undefined, restoreLessThan(node.props.children));
    }

    return node;
}

/**
 * The parent Trans renders its nodes in.
 *
 * @param {Object} props - The props of the component.
 * @returns {ReactElement}
 */
function TranslationNodes({ children }: { children?: ReactNode; }) {
    return <>{ restoreLessThan(children) }</>;
}

/**
 * Renders a translation which has index tags, for example "Read more <0>here</0>.", with the Trans component of
 * react-i18next. The code gives the elements for the tags, and the translation gives only their text.
 *
 * Trans puts the values in the translation and then parses the result as markup, so a "<" in a value would hide the
 * text which follows it. A placeholder replaces that character while Trans parses, which makes a value always text.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
// eslint-disable-next-line react/no-multi-comp
export default function TranslationWithMarkup({ components, i18nKey, values = {} }: IProps) {
    const textValues = Object.fromEntries(Object.entries(values).map(([ name, value ]) =>
        [ name, typeof value === 'string' ? value.split('<').join(LESS_THAN_PLACEHOLDER) : value ]));

    return (
        <Trans
            components = { components }
            i18n = { i18next }
            i18nKey = { i18nKey }

            // The type of this prop is wrong in react-i18next, it is the component to render the nodes in.
            parent = { TranslationNodes as unknown as ReactNode }
            values = { textValues } />
    );
}
