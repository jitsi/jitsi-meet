Jitsi Meet Translation
==========================
Jitsi Meet uses [i18next](http://i18next.com) library for translation.
i18next uses separate json files for each language.


Translating Jitsi Meet
======================
The translation of Jitsi Meet is integrated with Pootle. You can translate Jitsi Meet via our Pootle user interface on
[http://translate.jitsi.org](http://translate.jitsi.org).

**WARNING: Please don't create or edit manually the language files! Please use our Pootle user interface!**

Development
===========
If you want to add new functionality for Jitsi Meet and you have texts that need to be translated please use our translation module.
It is located in modules/translation. You must add key and value in main.json file in English for each translatable text.
Than you can use the key to get the translated text for the current language.

**WARNING: Please don't change the other language files except main.json! They must be updated and translated via our Pootle user interface!**

You can add translatable text in the HTML:


* **via attribute on HTML element** - add **data-i18n** attribute with value the key of the translatable text.


 ```
 <span data-i18n="dialog.OK">OK</span>
 ```


 You can also use APP.translation.generateTranslationHTML(key, options) to get this HTML code as Javascript string.


 ```
 APP.translation.generateTranslationHTML("dialog.OK") // returns <span data-i18n="dialog.OK">OK</span>
 ```

 The value in the options parameter will be added in data-i18n-options attribute of the element.

 **Note:** If you dynamically add HTML elements don't forget to call APP.translation.translateElement(jquery_selector) to translate the text initially.


 ```
 APP.translation.translateString("dialog.OK") // returns the value for the key of the current language file. "OK" for example.
 ```

For the available values of ``options`` parameter for the above methods of translation module see [i18next documentation](http://i18next.com/pages/doc_features).

**Note:** It is useful to add attributes in the HTML for persistent HTML elements because when the language is changed the text will be automatically translated.




