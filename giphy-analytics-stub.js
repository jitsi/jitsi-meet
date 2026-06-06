// Stub replacement for @giphy/js-analytics to prevent beforeunload handlers
// This completely disables all Giphy analytics functionality

export const pingback = () => {
    // Completely disabled - do nothing

};

export const mergeAttributes = (attributes, newAttributes) => {
    // Return merged attributes without any analytics calls
    return { ...attributes,
        ...newAttributes };
};

// Ensure no beforeunload handlers are ever registered
export default pingback;
