### Adding an icon to the font file (e.g. for the floating menu)
1. Go to https://icomoon.io/app/
2. Go to "Manage Projects" from the menu on the top left.
3. Use "Import project" and select <code>fonts/selection.json</code> from Jitsi Meet.
4. Click "load".
5. Add the new icons using the "Add icons from library" button...
6. Go to "generate font" and make sure the identifiers for the new icons are correct.
7. Download the result in a zip file using the "download" button.
8. Copy <code>selection.json</code> and <code>fonts/jitsi.*</code> from the zip file to <code>fonts/</code> in Jitsi Meet
9. Copy the class for the new icon from <code>style.css</code> in the zip file to <code>css/_font.scss</code> in Jitsi Meet (do *not* copy the whole file)

Sample commit: https://github.com/jitsi/jitsi-meet/commit/68bc819b89aec12364fcf07b81efa83a1900eed6
