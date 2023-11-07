
# SecureRate

SecureRate is a web extension designed to enhance online security by providing users with a rating on various security aspects.
Included in this project is a website to install the extension from along with the extension itself.


## Features

- Real-Time Assessment: Providing real-time risk assessments of the websites you visit, ensuring your online safety.
- Security Ratings: Get to know the reputation of websites before you interact with them.
- Privacy-Focused: Doesn't collect any data on it's own.

## Usage of API's
The extension relies on (free) API's to provide some of it's security ratings.
It depends on:

- [HaveIBeenPwned's v3 API](https://haveibeenpwned.com/API/v3): to check whether a website has been breached.
- [2FA Directory's API](https://2fa.directory/api/): to check whether a website has 2FA enabled.
- [Mozilla's Cloudflare Resolver](https://developers.cloudflare.com/1.1.1.1/privacy/cloudflare-resolver-firefox/): to check whether has DNSSec enabled.

It further makes use of some Malware-Filter's (uBlock Origin, AdGuard etc.) filter lists:
- [Malicious URL list](https://gitlab.com/malware-filter/urlhaus-filter)
- [Phishing URL list](https://gitlab.com/malware-filter/phishing-filter)

## Installation
Python is required for this project to be able to run along with [pip](https://pip.pypa.io/en/stable/).

The following Python modules are needed as well:

```
click
Flask
gunicorn
importlib-metadata
inflection
itsdangerous
Jinja2
MarkupSafe
Werkzeug
zipp
```
These can be installed with:

```pip install -r requirements.txt```

Once installed you can run the project with:

```flask run```
or ```python app.py```.


## Usage

1. Open your web browser and go to http://127.0.0.1:5000/
2. Install the extension from the website by unzipping and enabling Dev Tools in the Extensions Section.

## Acknowledgements

 - [Awesome Readme Templates](https://awesomeopensource.com/project/elangosundar/awesome-README-templates)


## License

[MIT](https://choosealicense.com/licenses/mit/)

