# OuderApp KidsConnect backup tool
The [OuderApp](https://ouderapp.kidskonnect.nl/) is an app used by daycare centres. Unfortunately you can only download photos/videos that are tagged, and not the untagged photos/videos. This tool downloads all historic photos, videos, messages and documents to your local computer.

## How to use it
Download and run one of these files (depending on your operating system):
- [Windows](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/Windows.EXE.exe) (or use the [ZIP](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/Windows.ZIP.zip) if the browser or virus scanner prevents downloading it)
- [Mac ARM](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/macOS.ARM64)
- [Mac x86](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/macOS.x86_64)
- [Linux ARM](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/Linux.ARM64)
- [Linux x86](https://github.com/sjoerdsmink/OuderApp/releases/latest/download/Linux.x86_64)

You can find all these files on the [latest release](https://github.com/sjoerdsmink/OuderApp/releases/latest) page.

After opening the file, it's self-explanatory. It will ask you for your daycare centre url, username and password, and where to store the backup. It will then start downloading everything; in the meantime you can see the progress.

If you see any errors or have suggestions, please [open an issue](https://github.com/sjoerdsmink/OuderApp/issues).

## For developers
To create a new release: run `deno task compile`. To create all releases:
```bash
for target in x86_64-pc-windows-msvc x86_64-apple-darwin aarch64-apple-darwin x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
  echo "Compiling for $target..."
  deno compile --frozen --target $target --allow-all --output build/$target main.ts
done
```
Optionally [code sign](https://docs.deno.com/runtime/reference/cli/compile/#code-signing) the Windows and Mac files to prevent issues with virus/malware scanners.

If you want to run it locally:
- Install [deno](https://docs.deno.com/runtime/getting_started/installation/)
- Run `deno install`
- Run `deno run --allow-all main.ts`
