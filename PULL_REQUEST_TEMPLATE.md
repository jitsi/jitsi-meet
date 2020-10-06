> **INSTRUCTIONS**
> Please make your PR readme as readable as possible. Only keep parts of this template that are filled out and meaningful to the reviewer.
>
> - Remove any quoted parts of the template below `>`. (These are just instructions for you to follow)
> - Leave all headings, but clear content and mark as `N/A` if irrelevant.
> - Most importantly: explain the "WHY". Do your best to give the reviewer some context about this change.

## Description
- [Jira Ticket](https://janeapp.atlassian.net/browse/...)

> Provide a summary of the problem being solved, the work done, and what was added/removed/changed

### General PR Class
🐛 = Bug Fix (Fixes an Issue)
🌟 = New Feature (Adds Functionality)
🏇 = Performance improvement
👁 = UX / UI improvement
🏗 = Refactor
🌦 = Env Changes
☕️ = JS Dependency Changes
⚛️ = Jane Desktop Changes

### Release Note
> Describe here a CS friendly version of what this fixes/adds. If the change is behind a feature flag, please include that in your description. If this is a hidden change CS doesn't need to really know about then just say so.

### Dependencies / ENV
> Describe any dependencies or ENV variables that are required for this change. Notify the team, if they have to update their environment.

### Risk Scorecard
> 1. As the author you should check the boxes that correspond with your PR and then use the following guide to set your risk label:
> * 0 checkboxes => low risk
> * 1-3 checkboxes => medium risk
> * 4+ checkboxes => high risk
> 2. Unless exempt, checked risk factors should be explained comprehensively in the Release Risk Assessment section below
> 3. Medium or higher risk PRs should get more than one code-review approval
>
> NOTE: if you aren't changing any production files, please use the zero risk label

- [ ] requires env configuration to be added in production
- [ ] js package changes<sup>1</sup>
- [ ] more than 200 LOC changed in production files<sup>1</sup>
- [ ] includes a user-facing workflow change to an existing production feature (user muscle memory or pattern recognition will be affected)
- [ ] could prevent access to Jane Video (eg. cors, middleware, changes to auth system)
- [ ] affects a widely used component or piece of code
- [ ] I have a doubt - I want the RMT to review this. If possible, please elaborate your concerns in the risk assessment section.

<sup>1</sup> No need to explain these risk factors below

### Release Risk Assessment
> Describe what areas of Jane are touched by the change in this PR, and what it would look like if something were to go wrong, and how much damage could be done. Keep your neighborhood deployer in mind when filling in this section, it will help identify errant PRs more quickly during deploy.

### Demo Notes
> If you have instructions on how to demo or a video add it here

## Code Review
Resource: [Dev Team Notion Page](https://www.notion.so/janeapp/Dev-Team-f06c6eb2ccca4066bc63fc1ac1bd2549)
Resource: [Code Review Checklist](https://www.notion.so/janeapp/Code-Review-checklist-2c510c527ac7470c902a5e8f25f9db3c)

- [ ] I clearly explained the WHY behind the work, in the Description above

#### Design
- [ ] I added instructions for how to test, in the QA section below
- [ ] I added specs for changes, or determined that none were required
- [ ] I demoed this to the appropriate person
- [ ] I considered both mobile & desktop views, or that wasn't relevant

#### Code
- [ ] I committed code with informative git messages
- [ ] I wrote readable code, or added comments if it was complex
- [ ] I performed a self-review of my own code
- [ ] I rebased my branch on the latest `master`

## QA and Smoke Testing
### Steps to Reproduce
> - Add steps on how to reproduce the problem and how to test
> - ie. Create Appointment > Clicked Arrived > Pay > Look for "this"

### Fixed / Expected Behaviour
> - What new behaviour does QA and Review need to look out for?

### Jane Desktop
> - Should these changes be tested in Jane Desktop? If the PR touches any of the [areas outlined here](https://www.notion.so/janeapp/Jane-Desktop-a10c9c06b180487982a3ef67d6163db9#9ea43281537e458089a87229e7281612), the answer is probably yes. If yes, indicate which areas.
> - How to test [video-chat inside Jane Desktop locally is outlined here](https://github.com/janeapp/jane_electron/blob/master/README.md#testing-video-chat)

### Other Considerations
> - Will this affect other parts of the app or views?
> - How can the success of this work be confirmed after release to production?
> - What QA have you already done?

## Screenshots
### Before
### After
