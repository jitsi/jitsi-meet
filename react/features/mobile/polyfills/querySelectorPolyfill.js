// Regex constants for efficient reuse across selector parsing
const SIMPLE_TAG_NAME_REGEX = /^[a-zA-Z][\w-]*$/;
const MULTI_ATTRIBUTE_SELECTOR_REGEX = /^([a-zA-Z][\w-]*)?(\[(?:\*\|)?([^=\]]+)=["']?([^"'\]]+)["']?\])+$/;
const SINGLE_ATTRIBUTE_REGEX = /\[(?:\*\|)?([^=\]]+)=["']?([^"'\]]+)["']?\]/g;
const WHITESPACE_AROUND_COMBINATOR_REGEX = /\s*>\s*/g;

/**
 * Parses a CSS selector into reusable components.
 *
 * @param {string} selector - The CSS selector to parse.
 * @returns {Object} - Object with tagName and attrConditions properties.
 */
function _parseSelector(selector) {
    // Wildcard selector
    if (selector === '*') {
        return {
            tagName: null, // null means match all tag names
            attrConditions: []
        };
    }

    // Simple tag name
    if (SIMPLE_TAG_NAME_REGEX.test(selector)) {
        return {
            tagName: selector,
            attrConditions: []
        };
    }

    // Attribute selector: tagname[attr="value"] or
    // tagname[attr1="value1"][attr2="value2"] (with optional wildcard namespace)
    const multiAttrMatch = selector.match(MULTI_ATTRIBUTE_SELECTOR_REGEX);

    if (multiAttrMatch) {
        const tagName = multiAttrMatch[1];
        const attrConditions = [];
        let attrMatch;

        while ((attrMatch = SINGLE_ATTRIBUTE_REGEX.exec(selector)) !== null) {
            attrConditions.push({
                name: attrMatch[1], // This properly strips the *| prefix
                value: attrMatch[2]
            });
        }

        return {
            tagName,
            attrConditions
        };
    }

    // Unsupported selector
    throw new SyntaxError(`Unsupported selector pattern: '${selector}'`);
}

/**
 * Filters elements by selector pattern and handles findFirst logic.
 *
 * @param {Element[]} elements - Array of elements to filter.
 * @param {string} selector - CSS selector to match against.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Filtered results with proper return type.
 */
function _filterAndMatchElements(elements, selector, findFirst) {
    const { tagName, attrConditions } = _parseSelector(selector);

    const results = [];

    for (const element of elements) {
        // Check tag name if specified
        if (tagName && !(element.localName === tagName || element.tagName === tagName)) {
            continue;
        }

        // Check if all attribute conditions match
        const allMatch = attrConditions.every(condition =>
            element.getAttribute(condition.name) === condition.value
        );

        if (allMatch) {
            results.push(element);
            if (findFirst) {
                return element;
            }
        }
    }

    return findFirst ? null : results;
}

/**
 * Handles direct child traversal for selectors with > combinators.
 * This is the shared logic used by both scope selectors and regular direct child selectors.
 *
 * @param {Element[]} startElements - Array of starting elements to traverse from.
 * @param {string[]} selectorParts - Array of selector parts split by '>'.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _traverseDirectChildren(startElements, selectorParts, findFirst) {
    let currentElements = startElements;

    for (const part of selectorParts) {
        const nextElements = [];

        currentElements.forEach(el => {
            // Get direct children
            const directChildren = Array.from(el.children || []);

            // Use same helper as handlers
            const matchingChildren = _filterAndMatchElements(directChildren, part, false);

            nextElements.push(...matchingChildren);
        });

        currentElements = nextElements;

        // If we have no results, we can stop early (applies to both querySelector and querySelectorAll)
        if (currentElements.length === 0) {
            return findFirst ? null : [];
        }
    }

    return findFirst ? currentElements[0] || null : currentElements;
}

/**
 * Handles :scope pseudo-selector cases with direct child combinators.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _handleScopeSelector(node, selector, findFirst) {
    let searchSelector = selector.substring(6);

    // Handle :scope > tagname (direct children)
    if (searchSelector.startsWith('>')) {
        searchSelector = searchSelector.substring(1);

        // Split by > and use shared traversal logic
        const parts = searchSelector.split('>');

        // Start from the node itself (scope)
        return _traverseDirectChildren([ node ], parts, findFirst);
    }

    return null;
}

/**
 * Handles nested > selectors (direct child combinators).
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _handleDirectChildSelectors(node, selector, findFirst) {
    const parts = selector.split('>');

    // First find elements matching the first part (this could be descendants, not just direct children)
    const startElements = _querySelectorInternal(node, parts[0], false);

    // If no starting elements found, return early
    if (startElements.length === 0) {
        return findFirst ? null : [];
    }

    // Use shared traversal logic for the remaining parts
    return _traverseDirectChildren(startElements, parts.slice(1), findFirst);
}

/**
 * Handles simple tag name selectors.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _handleSimpleTagSelector(node, selector, findFirst) {
    const elements = Array.from(node.getElementsByTagName(selector));

    if (findFirst) {
        return elements[0] || null;
    }

    return elements;
}

/**
 * Handles attribute selectors: tagname[attr="value"] or tagname[attr1="value1"][attr2="value2"].
 * Supports single or multiple attributes with optional wildcard namespace (*|).
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _handleAttributeSelector(node, selector, findFirst) {
    const { tagName } = _parseSelector(selector); // Just to get tagName for optimization

    // Handler's job: find the right elements to search
    const elementsToCheck = tagName
        ? Array.from(node.getElementsByTagName(tagName))
        : Array.from(node.getElementsByTagName('*'));

    // Common helper does the matching
    return _filterAndMatchElements(elementsToCheck, selector, findFirst);
}

/**
 * Internal function that implements the core selector matching logic for both
 * querySelector and querySelectorAll. Supports :scope pseudo-selector, direct
 * child selectors, and common CSS selectors.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector to match elements against.
 * @param {boolean} findFirst - If true, return after finding the first match.
 * @returns {Element[]|Element|null} - Array of Elements for querySelectorAll,
 * single Element or null for querySelector.
 */
function _querySelectorInternal(node, selector, findFirst = false) {
    // Normalize whitespace around > combinators first
    const normalizedSelector = selector.replace(WHITESPACE_AROUND_COMBINATOR_REGEX, '>');

    // Handle :scope pseudo-selector
    if (normalizedSelector.startsWith(':scope')) {
        return _handleScopeSelector(node, normalizedSelector, findFirst);
    }

    // Handle nested > selectors (direct child combinators)
    if (normalizedSelector.includes('>')) {
        return _handleDirectChildSelectors(node, normalizedSelector, findFirst);
    }

    // Fast path: simple tag name
    if (normalizedSelector === '*' || SIMPLE_TAG_NAME_REGEX.test(normalizedSelector)) {
        return _handleSimpleTagSelector(node, normalizedSelector, findFirst);
    }

    // Attribute selector: tagname[attr="value"] or
    // tagname[attr1="value1"][attr2="value2"] (with optional wildcard namespace)
    if (normalizedSelector.match(MULTI_ATTRIBUTE_SELECTOR_REGEX)) {
        return _handleAttributeSelector(node, normalizedSelector, findFirst);
    }

    // Unsupported selector - throw SyntaxError to match browser behavior
    throw new SyntaxError(`Failed to execute 'querySelector${
        findFirst ? '' : 'All'}' on 'Element': '${selector}' is not a valid selector.`);
}

/**
 * Implements querySelector functionality using the shared internal logic.
 * Supports the same selectors as querySelectorAll but returns only the first match.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selectors - The CSS selector to match elements against.
 * @returns {Element|null} - The first Element which matches the selector, or null.
 */
export function querySelector(node, selectors) {
    return _querySelectorInternal(node, selectors, true);
}

/**
 * Implements querySelectorAll functionality using the shared internal logic.
 * Supports :scope pseudo-selector, direct child selectors, and common CSS selectors.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selector - The CSS selector to match elements against.
 * @returns {Element[]} - Array of Elements matching the selector.
 */
export function querySelectorAll(node, selector) {
    return _querySelectorInternal(node, selector, false);
}
