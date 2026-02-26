import hljs from 'highlight.js/lib/core';
import bashLang from 'highlight.js/lib/languages/bash';
import cppLang from 'highlight.js/lib/languages/cpp';
import csharpLang from 'highlight.js/lib/languages/csharp';
import cssLang from 'highlight.js/lib/languages/css';
import goLang from 'highlight.js/lib/languages/go';
import javaLang from 'highlight.js/lib/languages/java';
import javascriptLang from 'highlight.js/lib/languages/javascript';
import jsonLang from 'highlight.js/lib/languages/json';
import kotlinLang from 'highlight.js/lib/languages/kotlin';
import phpLang from 'highlight.js/lib/languages/php';
import pythonLang from 'highlight.js/lib/languages/python';
import rubyLang from 'highlight.js/lib/languages/ruby';
import rustLang from 'highlight.js/lib/languages/rust';
import sqlLang from 'highlight.js/lib/languages/sql';
import swiftLang from 'highlight.js/lib/languages/swift';
import typescriptLang from 'highlight.js/lib/languages/typescript';
import xmlLang from 'highlight.js/lib/languages/xml';
import yamlLang from 'highlight.js/lib/languages/yaml';
import React, { ReactElement, ReactNode } from 'react';
import { toArray } from 'react-emoji-render';
import { makeStyles } from 'tss-react/mui';

import Linkify from '../../../base/react/components/web/Linkify';

// Register languages with highlight.js
hljs.registerLanguage('javascript', javascriptLang);
hljs.registerLanguage('typescript', typescriptLang);
hljs.registerLanguage('python', pythonLang);
hljs.registerLanguage('java', javaLang);
hljs.registerLanguage('cpp', cppLang);
hljs.registerLanguage('csharp', csharpLang);
hljs.registerLanguage('xml', xmlLang);
hljs.registerLanguage('html', xmlLang);
hljs.registerLanguage('css', cssLang);
hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('bash', bashLang);
hljs.registerLanguage('shell', bashLang);
hljs.registerLanguage('sql', sqlLang);
hljs.registerLanguage('go', goLang);
hljs.registerLanguage('rust', rustLang);
hljs.registerLanguage('php', phpLang);
hljs.registerLanguage('ruby', rubyLang);
hljs.registerLanguage('kotlin', kotlinLang);
hljs.registerLanguage('swift', swiftLang);
hljs.registerLanguage('yaml', yamlLang);

interface IProps {

    /**
     * Optional screen reader help text.
     */
    screenReaderHelpText?: string;

    /**
     * The raw message text potentially containing markdown.
     */
    text: string;
}

type TClasses = ReturnType<typeof useStyles>['classes'];

const useStyles = makeStyles()(() => {
    return {
        codeBlock: {
            background: '#1e1e1e',
            fontFamily: 'monospace',
            padding: '12px',
            borderRadius: '6px',
            overflowX: 'auto' as const,
            position: 'relative' as const,
            margin: '4px 0',
            display: 'block',

            '& code': {
                fontFamily: 'monospace',
                fontSize: '0.875em',
                color: '#d4d4d4',
            },

            '& .hljs-keyword': { color: '#569cd6' },
            '& .hljs-built_in': { color: '#4ec9b0' },
            '& .hljs-type': { color: '#4ec9b0' },
            '& .hljs-literal': { color: '#569cd6' },
            '& .hljs-number': { color: '#b5cea8' },
            '& .hljs-regexp': { color: '#d16969' },
            '& .hljs-string': { color: '#ce9178' },
            '& .hljs-subst': { color: '#d4d4d4' },
            '& .hljs-symbol': { color: '#d4d4d4' },
            '& .hljs-class': { color: '#4ec9b0' },
            '& .hljs-function': { color: '#dcdcaa' },
            '& .hljs-title': { color: '#dcdcaa' },
            '& .hljs-params': { color: '#d4d4d4' },
            '& .hljs-comment': { color: '#6a9955', fontStyle: 'italic' },
            '& .hljs-doctag': { color: '#608b4e' },
            '& .hljs-meta': { color: '#9b9b9b' },
            '& .hljs-meta-keyword': { color: '#569cd6' },
            '& .hljs-meta-string': { color: '#ce9178' },
            '& .hljs-section': { color: '#dcdcaa' },
            '& .hljs-tag': { color: '#569cd6' },
            '& .hljs-name': { color: '#569cd6' },
            '& .hljs-attr': { color: '#9cdcfe' },
            '& .hljs-attribute': { color: '#9cdcfe' },
            '& .hljs-variable': { color: '#9cdcfe' },
            '& .hljs-bullet': { color: '#d4d4d4' },
            '& .hljs-code': { color: '#d4d4d4' },
            '& .hljs-emphasis': { fontStyle: 'italic' },
            '& .hljs-strong': { fontWeight: 'bold' },
            '& .hljs-formula': { color: '#d4d4d4' },
            '& .hljs-link': { color: '#4e94ce' },
            '& .hljs-quote': { color: '#6a9955' },
            '& .hljs-selector-tag': { color: '#569cd6' },
            '& .hljs-selector-id': { color: '#569cd6' },
            '& .hljs-selector-class': { color: '#569cd6' },
            '& .hljs-selector-attr': { color: '#569cd6' },
            '& .hljs-selector-pseudo': { color: '#569cd6' },
            '& .hljs-template-tag': { color: '#569cd6' },
            '& .hljs-template-variable': { color: '#9cdcfe' },
            '& .hljs-addition': { color: '#b5cea8' },
            '& .hljs-deletion': { color: '#d16969' },
        },

        codeLanguageBadge: {
            position: 'absolute' as const,
            top: '4px',
            right: '8px',
            fontSize: '0.7em',
            color: '#858585',
            fontFamily: 'monospace',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
        },

        inlineCode: {
            background: 'rgba(255,255,255,0.1)',
            fontFamily: 'monospace',
            fontSize: '0.875em',
            padding: '1px 4px',
            borderRadius: '3px',
        },
    };
});

/**
 * Renders a syntax-highlighted code block using highlight.js.
 *
 * @param {Object} opts - Options object.
 * @param {TClasses} opts.classes - CSS class names from makeStyles.
 * @param {string} opts.code - The raw source code to highlight.
 * @param {string} opts.language - The language identifier (empty = auto-detect).
 * @param {string} opts.nodeKey - React key for the element.
 * @returns {ReactElement} The rendered pre/code element.
 */
function renderCodeBlock({
                             classes,
                             code,
                             language,
                             nodeKey,
                         }: {
    classes: TClasses;
    code: string;
    language: string;
    nodeKey: string;
}): ReactElement {
    let highlighted: string;

    try {
        if (language && hljs.getLanguage(language)) {
            highlighted = hljs.highlight(code, { language }).value;
        } else {
            highlighted = hljs.highlightAuto(code).value;
        }
    } catch {
        highlighted = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    return (
        <pre
            className = { classes.codeBlock }
            key = { nodeKey }>
            { language && (
                <span className = { classes.codeLanguageBadge }>
                    { language }
                </span>
            ) }
            <code
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML = {{ __html: highlighted }} />
        </pre>
    );
}

/**
 * Renders a plain text segment with emoji substitution and URL linkification,
 * matching the behaviour of the original Message component.
 *
 * @param {string} text - The plain text to render.
 * @param {string} key - A unique React key prefix.
 * @returns {ReactNode} The rendered content with emojis and links.
 */
function renderPlainSegment(text: string, key: string): ReactNode {
    if (!text) {
        return null;
    }

    const tokens = text.split(' ');
    const content: (string | ReactNode)[] = [];

    for (const token of tokens) {
        if (token.includes('://') || token.startsWith('@')) {
            content.push(token);
        } else {
            const emojified = [ ...toArray(token, { className: 'smiley' }) ];

            content.push(
                ...emojified.some(item => typeof item === 'string') ? [ token ] : emojified
            );
        }
        content.push(' ');
    }

    const nodes: ReactNode[] = [];

    content.forEach((token, index) => {
        if (typeof token === 'string' && token !== ' ') {
            nodes.push(
                <Linkify key = { `${key}-lnk-${index}` }>{ token }</Linkify>
            );
        } else {
            nodes.push(token);
        }
    });

    return <React.Fragment key = { key }>{ nodes }</React.Fragment>;
}

/**
 * Processes an inline text segment handling bold, italic, and inline-code markers.
 * Plain-text gaps are passed through emoji substitution and URL linkification.
 *
 * @param {string} text - The inline text to parse.
 * @param {TClasses} classes - CSS class names from makeStyles.
 * @param {string} keyPrefix - A unique key prefix for generated React nodes.
 * @returns {ReactNode[]} An array of React nodes representing the parsed inline content.
 */
function parseInline(text: string, classes: TClasses, keyPrefix: string): ReactNode[] {
    // Matches **bold**, *italic*, _italic_, `inline code`
    const inlinePattern = /(\*\*)([\s\S]+?)\1|\*([\s\S]+?)\*|_([\s\S]+?)_|`([^`]+)`/g;
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let idx = 0;

    // eslint-disable-next-line no-cond-assign
    while ((match = inlinePattern.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);

        if (before) {
            nodes.push(renderPlainSegment(before, `${keyPrefix}-plain-${idx}`));
            idx++;
        }

        if (match[1] === '**') {
            nodes.push(
                <strong key = { `${keyPrefix}-b-${idx}` }>
                    { parseInline(match[2], classes, `${keyPrefix}-b-${idx}`) }
                </strong>
            );
        } else if (match[3] !== undefined) {
            nodes.push(
                <em key = { `${keyPrefix}-em-${idx}` }>
                    { parseInline(match[3], classes, `${keyPrefix}-em-${idx}`) }
                </em>
            );
        } else if (match[4] !== undefined) {
            nodes.push(
                <em key = { `${keyPrefix}-em2-${idx}` }>
                    { parseInline(match[4], classes, `${keyPrefix}-em2-${idx}`) }
                </em>
            );
        } else if (match[5] !== undefined) {
            nodes.push(
                <code
                    className = { classes.inlineCode }
                    key = { `${keyPrefix}-code-${idx}` }>
                    { match[5] }
                </code>
            );
        }

        idx++;
        lastIndex = match.index + match[0].length;
    }

    const remaining = text.slice(lastIndex);

    if (remaining) {
        nodes.push(renderPlainSegment(remaining, `${keyPrefix}-plain-${idx}`));
    }

    return nodes;
}

/**
 * Parses a full message string, extracting fenced code blocks first, then
 * processing the remaining segments as inline markdown.
 *
 * @param {string} text - The raw message text.
 * @param {TClasses} classes - CSS class names from makeStyles.
 * @param {string} keyPrefix - A unique key prefix for generated React nodes.
 * @returns {ReactNode[]} An array of React nodes for the full parsed message.
 */
function parseMarkdown(text: string, classes: TClasses, keyPrefix: string): ReactNode[] {
    const codeBlockPattern = /```(\w+)?\n?([\s\S]*?)```/g;
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let idx = 0;

    // eslint-disable-next-line no-cond-assign
    while ((match = codeBlockPattern.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);

        if (before) {
            nodes.push(...parseInline(before, classes, `${keyPrefix}-inline-${idx}`));
            idx++;
        }

        const language = match[1] ?? '';
        const code = match[2] ?? '';

        nodes.push(
            renderCodeBlock({
                classes,
                code,
                language,
                nodeKey: `${keyPrefix}-cb-${idx}`,
            })
        );
        idx++;
        lastIndex = match.index + match[0].length;
    }

    const remaining = text.slice(lastIndex);

    if (remaining) {
        nodes.push(...parseInline(remaining, classes, `${keyPrefix}-inline-${idx}`));
    }

    return nodes;
}

/**
 * Renders a chat message with rich markdown support including fenced code blocks
 * with syntax highlighting, inline code spans, bold/italic text, and plain text
 * with emoji substitution and URL linkification.
 *
 * @returns {ReactElement} The rendered message paragraph.
 */
const MarkdownMessage = ({ text, screenReaderHelpText }: IProps) => {
    const { classes } = useStyles();

    const nodes = parseMarkdown(text ?? '', classes, 'msg');

    return (
        <p>
            { screenReaderHelpText && (
                <span className = 'sr-only'>
                    { screenReaderHelpText }
                </span>
            ) }
            { nodes }
        </p>
    );
};

export default MarkdownMessage;
