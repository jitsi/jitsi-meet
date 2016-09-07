/* global $, APP, interfaceConfig, JitsiMeetJS */

const DefaultBottomToolbarButtons = {
    'chat': {
        id: '#bottom_toolbar_chat',
        key: 'bottomtoolbar.chat'
    },
    'contacts': {
        id: '#bottom_toolbar_contact_list',
        key: 'bottomtoolbar.contactlist'
    },
    'filmstrip': {
        id: '#bottom_toolbar_film_strip',
        key: 'bottomtoolbar.filmstrip',
        shortcut: "F",
        shortcutAttr: "filmstripPopover",
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent("shortcut.film.toggled");
            APP.UI.handleToggleFilmStrip();
        },
        shortcutDescription: "keyboardShortcuts.toggleFilmstrip"
    }
};

export default DefaultBottomToolbarButtons;