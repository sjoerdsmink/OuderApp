for target in x86_64-pc-windows-msvc x86_64-apple-darwin aarch64-apple-darwin x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
  echo "Compiling for $target..."
  deno compile --frozen --target $target --allow-all --output build/$target main.ts
done