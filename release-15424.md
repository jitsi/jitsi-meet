## Configuration for Reporting via Gmail

Before checking the report functionality, you need to set up the Gmail username and password in the code to enable email reporting. Follow the steps below:

1. Navigate to the file at:
```
/react\features\chat\constants.ts
```
2. Open the constants.ts file and locate the section where email settings are configured.

3. Replace the placeholder values for Gmail credentials with the actual username and password.

```ts
/**
 * Gmail for reporting purpose.
 */
export const JITSI_MAIL = "jitsi@gmail.com"

/**
 * Gmail password for reporting purpose.
 */
export const JITSI_MAIL_PASSWORD = "jitsi@password"
```

4. After make dev proocess. Open a new terminal and run the following command:
```
make start-server
```
