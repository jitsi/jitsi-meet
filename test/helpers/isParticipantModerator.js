/**
 * Function that checks if the participant is moderator.
 *
 * @returns {void}
 */
export default async function isParticipantModerator() {
    await browser.execute(() => {
      return window.APP.store.getState()['features/base/participants'].local.role
        === 'moderator';
    });
}
