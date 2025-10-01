# Spixi MiniApp Packer

**Spixi MiniApp Packer** is a web-based utility for packaging Spixi-compatible Mini Apps. It allows developers to easily generate the `.zip` archive, `.spixi` metadata file, and `icon.png` required for publishing their app.

The packer is entirely browser-based and requires no installation or server-side components.

---

## Using the MiniApp Packer

To use the app packer:

1. Open the `index.html` file in a web browser (locally it will work only with Firefox) or access it from https://apps.spixi.io/packer.
2. Drag and drop your app folder (must contain `appinfo.spixi` and `app/index.html`) into the drop area.
3. The form will auto-populate with values from `appinfo.spixi`. Only the image and content URL fields are editable.
4. Click **Pack**.

The packer will:
- Generate a compressed `.zip` archive of your app
- Compute a SHA-256 checksum
- Create a `.spixi` metadata file including size and checksum
- Extract and save `icon.png` separately
- Prompt you to download all three files:
  - `yourapp.zip`
  - `yourapp.spixi`
  - `yourapp.png`

---

## Requirements

- Your app folder **must include**:
  - `appinfo.spixi` at the root
  - `app/index.html` inside a subfolder named `app/`
  - Optionally, an `icon.png` file inside `app/` (will be saved separately)

- `appinfo.spixi` must follow the format:
  ```
  caVersion = 0
  id = com.yourcompany.yourapp
  publisher = YourName
  name = YourApp
  version = 1.0.0
  capabilities = multiUser
  ```

---

## Output `.spixi` File Example

The generated `.spixi` file will include:
```
caVersion = 0
id = com.yourcompany.yourapp
publisher = YourName
name = YourApp
version = 1.0.0
capabilities = multiUser
image = yourapp.png
contentUrl = yourapp.zip
checksum = <sha256 checksum>
contentSize = <size in bytes>
```

---

## Hosting

Once packed, upload the following to your web host:
- `yourapp.zip`
- `yourapp.spixi`
- `yourapp.png`

Ensure the `image` and `contentUrl` fields in the `.spixi` file match the final public URLs.

---

## Development

The MiniApp Packer is a pure client-side app written in HTML and JavaScript using:

- JSZip – for ZIP archive generation
- FileSaver.js – for saving files locally
- Web Crypto API – for SHA-256 checksum

---

## Contributing

Feel like contributing or improving this tool? We welcome pull requests.

1. Fork this repository
2. Create a feature branch
3. Submit a pull request with a description of your changes

---

## Get in Touch

- **Website**: https://www.ixian.io  
- **Docs**: https://docs.ixian.io  
- **Discord**: https://discord.gg/pdJNVhv  
- **GitHub**: https://github.com/ixian-platform

