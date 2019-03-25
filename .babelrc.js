module.exports = api => ({
  presets: [
    [
      "@4c/4catalyzer",
      {
        target: "web",
        modules: api.env() === "esm" ? false : "commonjs"
      }
    ],
    "@babel/preset-typescript"
  ]
});
