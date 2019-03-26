module.exports = api => ({
  presets: [
    [
      "@4c",
      {
        target: "web",
        modules: api.env() === "esm" ? false : "commonjs"
      }
    ],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",
    "relay"
  ]
});
