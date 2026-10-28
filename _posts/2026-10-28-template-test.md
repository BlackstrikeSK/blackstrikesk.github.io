---
title: "Test"
summary: Beep boop boop.
family: ExampleFamily
filetype: crunchy
platform: Windows x99
size: 111kB
first_seen: 2026-10-01
sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
tags: [template, loader, windows]
---

This is a template. Nothing fancy.

A new paragraph! Wow! I am going to talk talk talk

## Triage

I shall triage the files...

| Property | Value |
|---|---|
| Compile timestamp | `2026-09-29 11:42:07 UTC` |
| Packer | Custom, high-entropy `.rsrc` |
| Notable imports | `VirtualAlloc`, `CreateThread`, `InternetOpenA` |

> **Note:** Callouts are plain Markdown blockquotes.

## Unpacking

Here I show unpacking
```markdown
![Entry point after the decryption stub](/assets/img/decrypt-stub.png)
*Figure 1: Entry point after the decryption stub.*
```

### Decrypting the configuration

Here I decrypt it's yummy config

```python
def decode_config(blob: bytes, key: int) -> bytes:
    return bytes(b ^ key for b in blob)

with open("config.bin", "rb") as f:
    print(decode_config(f.read(), 0x5A).decode("utf-8", "replace"))
```

## Behavior

Yap about what is does

## Indicators of compromise

Ioc's omgggg!

| Type | Indicator |
|---|---|
| Domain | `update-check[.]example[.]com` |
| IP address | `192[.]0[.]2[.]10` |
| Mutex | `Global\ExampleLoader_1` |
| Registry | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Updater` |

## Detection

maybe rules if I am not lazyy

```text
rule ExampleLoader_Stub
{
    meta:
        description = "Fictional example rule"
    strings:
        $stub = { 8A 04 0E 34 5A 88 04 0E 41 3B CA 72 F3 }
    condition:
        uint16(0) == 0x5A4D and $stub
}
```

## Takeaways

Defender sucks