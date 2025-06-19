# OuderApp KidsConnect backup tool
The [OuderApp](https://ouderapp.kidskonnect.nl/) is an app used by daycare centres. Unfortunately you can only download photos/videos that are tagged, and not the untagged photos/videos. This tool downloads all historic photos, videos, messages and documents to your local computer.

## How to use it
Download and run one of the [releases](https://github.com/sjoerdsmink/OuderApp/releases).
- [Windows](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/Windows.EXE.exe) or use the [ZIP](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/Windows.ZIP.zip) if the browser or virus scanner gives a warning.
- [Mac ARM](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/macOS.ARM64)
- [Mac x86](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/macOS.x86_64)
- [Linux ARM](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/Linux.ARM64)
- [Linux x86](https://github.com/sjoerdsmink/OuderApp/releases/download/v1.1.2/Linux.x86_64)

## For developers
To create a new release: run `deno task compile`. To create all releases:
```bash
for target in x86_64-pc-windows-msvc x86_64-apple-darwin aarch64-apple-darwin x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
  echo "Compiling for $target..."
  deno compile --frozen --target $target --allow-all --output build/$target main.ts
done
```
Optionally [code sign](https://docs.deno.com/runtime/reference/cli/compile/#code-signing) the Windows and Mac files to help virus/malware scanners.

If you want to run it locally:
- Install [deno](https://docs.deno.com/runtime/getting_started/installation/)
- Run `deno install`
- Run `deno run --allow-all main.ts`
