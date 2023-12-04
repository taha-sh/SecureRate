# SecureRate

SecureRate is a web extension designed to enhance online security by providing users with a rating on various security aspects. 

![Get it on Chrome](https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png)

## Features

- **Real-Time Assessment**: Providing real-time risk assessments of the websites you visit, ensuring your online safety.
- **Security Ratings**: Get to know the reputation of websites before you interact with them.
- **Privacy-Focused**: Doesn't collect any data on its own.

## Usage of APIs
The extension relies on free APIs to provide some of its security ratings, including:

- [HaveIBeenPwned's v3 API](https://haveibeenpwned.com/API/v3) - Checks whether a website has been breached.
- [2FA Directory's API](https://2fa.directory/api/) - Verifies if a website has 2FA enabled.
- [Mozilla's Cloudflare Resolver](https://developers.cloudflare.com/1.1.1.1/privacy/cloudflare-resolver-firefox/) - Checks if a website has DNSSEC enabled.

It also uses some Malware-Filter's (uBlock Origin, AdGuard, etc.) filter lists:
- [Malicious URL list](https://gitlab.com/malware-filter/urlhaus-filter)
- [Phishing URL list](https://gitlab.com/malware-filter/phishing-filter)

## Installation

To install SecureRate:

### From the Chrome Web Store

1. Visit the [SecureRate extension page](https://chromewebstore.google.com/detail/securerate/aijifjemahdbblgmcddikkmlgkcilabl) on the Chrome Web Store.
2. Click on "Add to Chrome" to install.

### Manual Installation (Advanced)

1. Clone the repository or download the extension files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" at the top right.
4. Click on "Load unpacked" and select the directory containing the extension files.

(Note: Manual installation is not recommended for general users.)

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).

---
