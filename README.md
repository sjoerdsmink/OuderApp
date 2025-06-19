# OuderApp KidsConnect backup tool
The [OuderApp](https://ouderapp.kidskonnect.nl/) is an app used by daycare centres. Unfortunately you can only download photos/videos that are tagged, and not the untagged photos/videos. This tool downloads all historic photos, videos, messages and documents to your local computer.

## How to use it
Download and run one of the [releases](https://github.com/sjoerdsmink/OuderApp/releases) 

## For developers
To create a new release: run `deno task compile`. To create all releases:
```bash
for target in x86_64-pc-windows-msvc x86_64-apple-darwin aarch64-apple-darwin x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
  echo "Compiling for $target..."
  deno compile --frozen --target $target --allow-all --output build/$target main.ts
done
```

If you want to run it locally:
- Install [deno](https://docs.deno.com/runtime/getting_started/installation/)
- Run `deno install`
- Run `deno run --allow-all main.ts`
