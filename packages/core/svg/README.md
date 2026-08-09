# Folder for your icons

Drop `.svg` files here — they show up in the catalog automatically, no code changes needed.

## File requirements

- `viewBox="0 0 256 256"` (a single grid, like Phosphor)
- Stroke/fill of any color — on load they are replaced with `currentColor`,
  so that color selection in the interface works

## File name = icon name + weight

```
bell.svg           → the "Bell" icon, regular weight
bell-bold.svg      → the same icon, bold weight
bell.duotone.svg   → the same icon, duotone weight
bold/bell.svg      → the weight can also be set by a folder
```

Weights: `thin`, `light`, `regular`, `bold`, `fill`, `duotone`.
A weight without its own file falls back to `regular`.

While the folder is empty, the catalog shows placeholder squares from `../data.ts`.
