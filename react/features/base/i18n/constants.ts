/**
 * The options of react-i18next.
 */
export const REACT_I18NEXT_OPTIONS = {
    // re-render when a new resource bundle is added
    bindI18nStore: 'added',

    // The Trans component must create only the elements the code gives it. With this enabled it creates an element
    // for every tag it finds in a translation, a style element included, and a translation can come from outside the
    // app.
    transSupportBasicHtmlNodes: false,
    useSuspense: false
};
