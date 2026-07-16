'use strict';
require('p-fatal');
require('esbrowserify-pmb')({
  srcAbs: require.resolve('./pre2gfm.js'),
  verbosity: 1,
  minify: true,
  sourceMap: false,
  saveAs: './tmp.pre2gfm.min.js',
});
