/**
 * Icon optimization: `npm run icons:optimize`.
 *
 * Edits files in src/icons/svg in place, hence the conservative settings —
 * the sources must not break, they are the source of truth for both the site and the package.
 */
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // viewBox is needed: the icon renders on its own grid by it (24×24 and others)
          removeViewBox: false,
          // ids may be targets of <use>/gradients inside a single icon
          cleanupIds: false,
        },
      },
    },
    // the size is set by the component through the `size` prop, attributes in the file only get in the way
    { name: 'removeDimensions' },
  ],
}
