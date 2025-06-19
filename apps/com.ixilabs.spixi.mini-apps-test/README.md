# Spixi Mini Apps Test

This test Mini App demonstrates how to use the **Spixi Mini Apps SDK** to interact with the Spixi environment through a simple, browser-based interface. It is intended as a learning and debugging tool for developers building Spixi-compatible Mini Apps.

---

## 🎯 What You'll Learn

- How to use the SDK to:
  - Store and retrieve data via Spixi’s storage system
  - Send and receive network messages
  - Handle SDK callbacks

---

## 🚀 Getting Started

### Step 1: Open the App in Spixi

To test this app:

1. Replace placeholder SDK files `js/spixi-app-sdk.js` and `js/spixi-tools.js` with actual SDK files from the [`mini-apps-sdk`](../mini-apps-sdk)
2. Package it using the Spixi App Packer (see root `README.md`)
3. Load it into your Spixi client
4. Run the app from within a chat session

---

## 📄 File Structure

```text
mini-apps-test/
├── index.html              # Main HTML page
├── js/
│   ├── spixi-app-sdk.js    # Spixi SDK (imported from mini-apps-sdk)
│   ├── spixi-tools.js      # SDK utility functions
│   └── mini-apps-test.js   # Main app logic (this example)
```

---

## 🧪 Available Tests

### 🔹 Storage Data Test

Click **“Storage Data”** to run a sequence of storage operations:

1. Stores a key `testKey` with value `"testValue"`
2. Overwrites `testKey` with `"testValue2"`
3. Adds a second key `testKey3` with `"testValue3"`
4. Deletes `testKey`
5. Verifies all steps were successful

👉 **Expected result**: An alert saying “All tests have passed.”

---

### 🔹 Set Data Key with Random

Click **“Set Data Key with Random”** to:

* Generate a random number
* Base64-encode it
* Save it under `testKey1` in Spixi’s local storage

---

### 🔹 Get Data Key Value

Click **“Get Data Key Value”** to:

* Retrieve the value of `testKey1`
* Output it in the result box (`#miniAppsTestOutput`)

---

### 🔹 Send Random Network Data

Click **“Send Random Network Data”** to:

* Generate a random number
* Send it via `SpixiAppSdk.sendNetworkData()` to peers in the session

👉 **If a remote user (your chat peer) clicks the same button**, their message will be received and shown in your app’s output log using the `onNetworkData` callback.

---

## 🛠 Code Highlights

### 1. Setting Data

```javascript
SpixiAppSdk.setStorageData("testKey", btoa("value"));
```

### 2. Getting Data

```javascript
SpixiAppSdk.getStorageData("testKey");
SpixiAppSdk.onStorageData = function (key, value) {
    console.log(key, atob(value));
};
```

### 3. Sending Network Data

```javascript
SpixiAppSdk.sendNetworkData("Hello Spixi!");
```

### 4. Receiving Network Data

```javascript
SpixiAppSdk.onNetworkData = function (senderAddress, data) {
    appSdkDataReceived("onNetworkData", senderAddress + "=" + data);
};
```

### 5. Displaying Results

```javascript
function appSdkDataReceived(type, data) {
    document.getElementById("miniAppsTestOutput").innerHTML += type + ": " + data + "<br/>";
}
```

---

## 📌 Notes

* **Callback `onStorageData` is dynamically reassigned** during tests. This is important for verifying individual operations in sequence.
* Spixi requires data to be **base64-encoded before saving**, and **decoded after retrieval** using `btoa()` and `atob()`.
* Network data can only be sent and received when the app is running within an active Spixi session.

---

## 📜 License

This Mini App is part of the [Ixian Core](https://github.com/ixian-platform/Spixi-Mini-Apps) and is licensed under the [MIT License](../LICENSE).

---

## 🙌 Contribute

Found a bug? Want to add more test cases? Fork the repo, improve the code, and send a pull request!

---

## 🔗 Resources

* [Spixi SDK Overview](../mini-apps-sdk/README.md)
* [Official Website](https://www.ixian.io)
* [Developer Docs](https://docs.ixian.io)
