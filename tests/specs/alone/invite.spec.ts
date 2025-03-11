import { ensureOneParticipant } from '../../helpers/participants';
import { isDialInEnabled } from '../helpers/DialIn';

describe('Invite', () => {
    it('join participant', () => ensureOneParticipant(ctx, { preferGenerateToken: true }));

    it('url displayed', async () => {
        const { p1 } = ctx;
        const inviteDialog = p1.getInviteDialog();

        await inviteDialog.open();
        await inviteDialog.waitTillOpen();

        const driverUrl = await p1.driver.getUrl();

        expect(driverUrl.includes(await inviteDialog.getMeetingURL())).toBe(true);

        await inviteDialog.clickCloseButton();

        await inviteDialog.waitTillOpen(true);
    });

    it('dial-in displayed', async () => {
        const { p1 } = ctx;

        if (!await isDialInEnabled(p1)) {
            return;
        }

        const inviteDialog = p1.getInviteDialog();

        await inviteDialog.open();
        await inviteDialog.waitTillOpen();

        expect((await inviteDialog.getDialInNumber()).length > 0).toBe(true);
        expect((await inviteDialog.getPinNumber()).length > 0).toBe(true);
    });

    it('view more numbers', async () => {
        const { p1 } = ctx;

        if (!await isDialInEnabled(p1)) {
            return;
        }

        const inviteDialog = p1.getInviteDialog();

        await inviteDialog.open();
        await inviteDialog.waitTillOpen();

        const windows = await p1.driver.getWindowHandles();

        expect(windows.length).toBe(1);

        const meetingWindow = windows[0];

        const displayedNumber = await inviteDialog.getDialInNumber();
        const displayedPin = await inviteDialog.getPinNumber();

        await inviteDialog.openDialInNumbersPage();

        const newWindow = (await p1.driver.getWindowHandles()).filter(w => w !== meetingWindow);

        expect(newWindow.length).toBe(1);

        const moreNumbersWindow = newWindow[0];

        await p1.driver.switchWindow(moreNumbersWindow);

        await browser.pause(5000);

        await p1.driver.$('.dial-in-numbers-list').waitForExist();

        const conferenceIdMessage = p1.driver.$('//div[contains(@class, "pinLabel")]');

        expect((await conferenceIdMessage.getText()).replace(/ /g, '').includes(displayedPin)).toBe(true);

        const numbers = p1.driver.$$('.dial-in-number');

        const nums = await numbers.filter(
            async el => (await el.getText()).trim() === displayedNumber);

        expect(nums.length).toBe(1);
    });
});
