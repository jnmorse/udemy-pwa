module.exports = {
  globDirectory: 'public/',
  globPatterns: ['**/*.{html,ico,json,css,js}', 'src/images/*.{jpg,png}'],
  swDest: 'public/service-worker.js',
  globIgnores: ['help/**'],
  swSrc: 'public/sw-base.js'
};
