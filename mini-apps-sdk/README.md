# Spixi Mini Apps SDK

This directory contains the JavaScript SDK used to build and run Spixi Mini Apps within the Spixi ecosystem. The SDK provides integration points for communicating with the decentralized Ixian platform and managing Mini App state.

---

## Files

### `spixi-app-sdk.js`

This is the core interface between a Mini App and the Spixi platform. It exposes several functions and callback handlers to enable communication, data storage, and session control.

#### Features:

- **Event Triggers (Spixi → App):**
  - `onInit(sessionId, userAddresses)`  
    Called when the Mini App is initialized.
  - `onStorageData(key, value)`  
    Called when storage data is retrieved.
  - `onNetworkData(senderAddress, data)`  
    Called when network data is received from another user.
  - `onRequestAccept(data)` / `onRequestReject(data)`  
    Called when the user accepts or rejects a request.
  - `onAppEndSession(data)`  
    Called when a session ends.

- **Actions (App → Spixi):**
  - `fireOnLoad()`  
    Notifies Spixi that the app has finished loading.
  - `back()`  
    Signals a "go back" action.
  - `sendNetworkData(data)`  
    Sends data to other session participants.
  - `getStorageData(key)` / `setStorageData(key, value)`  
    Retrieves or stores local key-value data on the user's device.
  - `spixiAction(actionData)`  
    Executes a generic action, customizable per app.

---

### `spixi-tools.js`

A helper utility file containing general-purpose functions used by Mini Apps to encode, decode, and manage data safely and effectively.

#### Features:

- **`base64ToBytes(base64)`**  
  Converts a base64-encoded string to a decoded string.

- **`escapeParameter(str)` / `unescapeParameter(str)`**  
  Escapes or unescapes user-input values for safe DOM injection.

- **`getTimestamp()`**  
  Returns the current UNIX timestamp.

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

