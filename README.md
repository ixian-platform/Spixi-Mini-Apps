# Spixi Mini Apps

This repository contains everything you need to develop, package, and publish Mini Apps for the **Spixi** decentralized messenger. Whether you're building a single-user utility or a multi-user game, Spixi Mini Apps are fully client-side applications powered by HTML, CSS, and JavaScript - running securely inside Spixi via a WebView interface.

---

## What's Inside

### SDK (`mini-apps-sdk/`)
The official JavaScript SDK for building Spixi-compatible apps.

- `spixi-app-sdk.js` – Defines the interface between the Mini App and the Spixi client, including session lifecycle hooks, messaging, storage, and UI commands.
- `spixi-tools.js` – Utility helpers for string escaping, base64 decoding, timestamping, and UI command decoding.

Use this SDK in your Mini Apps to communicate with the Spixi client and other users in a session.

---

### App Packer (`app-packer/`)
A web-based utility for generating `.zspixiapp`, `.spixi`, and `icon.png` files needed to publish your app.

- 100% browser-based
- No installation or server required
- Creates valid `.spixi` metadata including checksum and size

Ideal for packaging and verifying your Mini App before deploying it to a host or submitting it to a directory.

> See [`app-packer/README.md`](./app-packer/README.md) for full instructions.

---

### Example Mini Apps (`apps/`)
Prebuilt Mini Apps to help you understand and explore what’s possible with Spixi Mini Apps.

Each example includes:

- Full source code (`index.html`, JS, CSS, assets)
- `appinfo.spixi` metadata
- App-specific icon
- Usage of the SDK to interact with Spixi

Included examples:

- **com.ixilabs.spixi.auth** – QR code authentication utility
- **com.ixilabs.spixi.gate-control** – QuIXI Gate Control Example App
- **com.ixilabs.spixi.mini-apps-test** - Testing and demo playground
- **com.ixilabs.spixi.tictactoe** – Multi-user Tic Tac Toe game
- **com.ixilabs.spixi.video-test** – Local video testing app
- **com.ixilabs.spixi.whiteboard** – Collaborative drawing whiteboard

Feel free to use these as reference templates or extend them into your own Mini Apps.

---

## Building Your Own Mini App

Mini Apps are self-contained folders structured as:
```
yourapp/
├── appinfo.spixi
├── icon.png
└── app/
│   ├── index.html
│   ├── js/
│   └── css/
```

Requirements:
- app/index.html – Entry point of your Mini App
- appinfo.spixi – Metadata file (see below)
- icon.png – Icon displayed in Spixi (recommended size: 512x512)

Sample appinfo.spixi
```
caVersion = 0
id = com.example.myapp
publisher = YourName
name = MyApp
version = 1.0.0
capabilities = multiUser
```

Once your app is ready, use the **App Packer** to generate `.zspixiapp`, `.spixi`, and `.png` files for publishing.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

## Resources

- [Ixian Platform](https://www.ixian.io)
- [Spixi Private Chat](https://www.spixi.io)
- [Main Repository](https://github.com/ixian-platform)

---

Happy building! 🚀  
Want to contribute? Fork, improve, and submit a pull request!
