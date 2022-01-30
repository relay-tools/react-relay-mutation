module.exports = api => ({
  presets: [
    [
      '@4c',
      {
        target: 'web',
        modules: api.env() === 'esm' ? false : 'commonjs',
      },
    ],
    '@babel/typescript',
  ],
});
