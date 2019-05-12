Document describing enabling various jitsi-meet integrations.

## Creating the Google API client for Google Calendar and Youtube integration
1. Log into a Google admin account.
1. Go to Google cloud platform dashboard. https://console.cloud.google.com/apis/dashboard
1. In the Select a Project dropdown, click New Project.
1. Give the project a name.
1. Proceed to the Credentials settings of the new project.
1. In the Credentials tab of the Credentials settings, click Create Credentials and select the type OAuth client ID.
1. Proceed with creating a Web application and add the domains (origins) on which the application will be hosted. Local development environments (http://localhost:8000 for example) can be added here.
1. While still in the Google cloud platform dashboard, click the Library settings for the calendar project.
1. Search for the Google Calendar API (used for calendar accessing), click its result, and enable it.
1. Do the same for YouTube Data API v3

## Creating the Microsoft app for Microsoft Outlook integration
1. Go to https://apps.dev.microsoft.com/
1. Proceed through the "Add an app" flow. Once created, a page with several Graph Permissions fields should display.
1. Under "Platforms" add "Web"
1. Add a redirect URL for the Microsoft auth flow to visit once a user has confirmed authentication. Target domain if available is just 'yourdomain.com' (the deployment address) and the redirect URL is `https://yourdomain.com/static/msredirect.html`.
1. Add Microsoft Graph delegated permissions, if this option is available: Calendars.Read, Calendars.ReadWrite, Calendars.Read.Shared, Calendars.ReadWrite.Shared.
1. Check `Allow Implicit Flow` (and `Restrict token issuing to this app` if available).
1. Save the changes.

## Creating the Dropbox app for Dropbox recording integration
1. You need a Dropbox account (If you don't already have one, you can sign up for a free account [here](https://www.dropbox.com/register).)
1. Create new App as described in [Getting Started Guide](https://www.dropbox.com/developers/reference/getting-started?_tk=guides_lp&_ad=guides2&_camp=get_started#app%20console) in App Console section.
1. Choose
    1. 'Dropbox API - For apps that need to access files in Dropbox.' 
    1. 'App folder– Access to a single folder created specifically for your app.'
    1. Fill in the name of your app
1. You need only, the newly created App key, goes in config.js in 
    ```
        dropbox: {
            appKey: '__dropbox_app_key__'
        }
    ```
1. Add your Redirect URIs in the form `https://yourdeployment.com//static/oauth.html`
1. Fill in Branding
