# Spixi Mini Apps SDK

This directory contains the JavaScript SDK used to build and run Spixi Mini Apps within the Spixi ecosystem.

The SDK provides integration points for communicating with the decentralized Ixian platform and managing Mini App state.

---

## Contents

- `spixi-app-sdk.js` – Core API for communication with the Spixi environment
- `spixi-tools.js` – Utility helper functions (encoding, escaping, timestamping, UI command decoding)

---

## Quick Start

1. Include both files in your app:
   ```html
   <script src="spixi-app-sdk.js"></script>
   <script src="spixi-tools.js"></script>
   ```

2. Use the SDK inside your app to interact with Spixi:

   ```javascript
   SpixiAppSdk.sendNetworkData("Hello other peer!");
   ```

3. Handle events by overriding the appropriate callbacks:

   ```javascript
   SpixiAppSdk.onInit = function(sessionId, userAddresses) {
       console.log("App session started:", sessionId, userAddresses);
   };

   SpixiAppSdk.onNetworkData = function(sender, data) {
       console.log("Received message from", sender, ":", data);
   };
   ```

---

## spixi-app-sdk.js API

| Function                     | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `fireOnLoad()`               | Notifies Spixi that the Mini App has loaded.  |
| `back()`                     | Signals a request to close the app view.      |
| `sendNetworkData(data)`      | Sends `data` to other users in the session.   |
| `getStorageData(key)`        | Requests a locally stored value by key.       |
| `setStorageData(key, value)` | Saves a key-value pair to local storage.      |
| `spixiAction(actionData)`    | Sends a custom action string to the host app. |

### Event Handlers to Override

| Handler                              | Description                                    |
| ------------------------------------ | ---------------------------------------------- |
| `onInit(sessionId, userAddresses)`   | Called when the Mini App starts.               |
| `onNetworkData(senderAddress, data)` | Called when data is received from the network. |
| `onStorageData(key, value)`          | Called when a stored value is received.        |
| `onRequestAccept(data)`              | Called when a session request is accepted.     |
| `onRequestReject(data)`              | Called when a session request is rejected.     |
| `onAppEndSession(data)`              | Called when the session ends.                  |

---

## spixi-tools.js Utilities

| Function                         | Description                                                       |
| -------------------------------- | ----------------------------------------------------------------- |
| `escapeParameter(str)`           | Escapes HTML-sensitive characters for safe embedding.             |
| `unescapeParameter(str)`         | Reverses the escaping of HTML-sensitive characters.               |
| `getTimestamp()`                 | Returns current UNIX timestamp.                                   |
| `executeUiCommand(cmd, ...args)` | Internal function required by Spixi to communicate with Mini App. |
| `base64ToBytes(base64)`          | Decodes a base64 string into a UTF-8 string.                      |

---

## Best Practices

- Always include spixi-app-sdk.js and spixi-tools.js in your app.
- Avoid modifying the SDK unless you're contributing upstream.
- Keep app logic separate from SDK logic.

## Updates

Check this folder for the latest SDK versions. All apps should stay updated with the latest SDK for compatibility.


## License

This SDK is licensed under the **MIT License**. See [LICENSE](../LICENSE) for details.

---

## Related Resources

- [Ixian Platform](https://www.ixian.io)
- [Spixi Private Chat](https://www.spixi.io)
- [Main Repository](https://github.com/ixian-platform)

