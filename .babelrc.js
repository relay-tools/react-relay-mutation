module.exports = api => ({
  presets: [
    [
      '@4c',
      {
        target: 'web',
        targets: {},
        modules: api.env() === 'esm' ? false : 'commonjs',
      },
    ],
    '@babel/typescript',
  ],
});
