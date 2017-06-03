# Comments

* Comments documenting the source code are required.

  * Comments from which documentation is automatically generated are **not**
    subject to case-by-case decisions. Such comments are used, for example, on
    types and their members. Examples of tools which automatically generate
    documentation from such comments include JSDoc, Javadoc, Doxygen.

  * Comments which are not automatically processed are strongly encouraged. They
    are subject to case-by-case decisions. Such comments are often observed in
    function bodies.

* Comments should be formatted as proper English sentences. Such formatting pays
  attention to, for example, capitalization and punctuation.

# Duplication

* Don't copy-paste source code. Reuse it.

# Formatting

* Line length is limited to 80 characters.

* Sort by alphabetical order in order to make the addition of new entities as
  easy as looking a word up in a dictionary. Otherwise, one risks duplicate
  entries (with conflicting values in the cases of key-value pairs). For
  example:

  * Within an `import` of multiple names from a module, sort the names in
    alphabetical order. (Of course, the default name stays first as required by
    the `import` syntax.)

    ````javascript
    import {
        DOMINANT_SPEAKER_CHANGED,
        JITSI_CLIENT_CONNECTED,
        JITSI_CLIENT_CREATED,
        JITSI_CLIENT_DISCONNECTED,
        JITSI_CLIENT_ERROR,
        JITSI_CONFERENCE_JOINED,
        MODERATOR_CHANGED,
        PEER_JOINED,
        PEER_LEFT,
        RTC_ERROR
    } from './actionTypes';
    ````

  * Within a group of imports (e.g. groups of imports delimited by an empty line
    may be: third-party modules, then project modules, and eventually the
    private files of a module), sort the module names in alphabetical order.

    ````javascript
    import React, { Component } from 'react';
    import { connect } from 'react-redux';
    ````

# Indentation

* Align `switch` and `case`/`default`. Don't indent the `case`/`default` more
  than its `switch`.

  ````javascript
  switch (i) {
  case 0:
      ...
      break;
  default:
      ...
  }
  ````

# Naming

* An abstraction should have one name within the project and across multiple
  projects. For example:

  * The instance of lib-jitsi-meet's `JitsiConnection` type should be named
    `connection` or `jitsiConnection` in jitsi-meet, not `client`.

  * The class `ReducerRegistry` should be defined in ReducerRegistry.js and its
    imports in other files should use the same name. Don't define the class
    `Registry` in ReducerRegistry.js and then import it as `Reducers` in other
    files.

* The names of global constants (including ES6 module-global constants) should
  be written in uppercase with underscores to separate words. For example,
  `BACKGROUND_COLOR`.

* The underscore character at the beginning of a name signals that the
  respective variable, function, property is non-public i.e. private, protected,
  or internal. In contrast, the lack of an underscore at the beginning of a name
  signals public API.
