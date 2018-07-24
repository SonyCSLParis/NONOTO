let webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (options) {
  return {
    entry: './index.ts',
    output: {
      path: __dirname + '/dist',
      filename: 'index.bundle.js'
    },

    // Currently we need to add '.ts' to the resolve.extensions array.
    resolve: {
      extensions: ['.ts', '.js', '.css', '.scss'],
      modules: ['node_modules', 'styles', '../opensheetmusicdisplay-fork',
        './tonejs-instruments']
    },

    // Source maps support ('inline-source-map' also works)
    devtool: 'source-map',

    // Add the loader for .ts files.
    module: {
      rules: [{
          test: /\.json$/,
          use: 'json-loader'
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                  configFileName: 'tsconfig.json'
              }
            }
          ]
      },
      {
          test: /\.(css|scss)$/,
          use: [
              "style-loader", // creates style nodes from JS strings
              "css-loader", // translates CSS into CommonJS
              "sass-loader" // compiles Sass to CSS
          ]},
       {
         test: /\.(png|svg|jpg|gif)$/,
         use: [
           'file-loader'
         ]
     },
     {
       test: /\.html$/,
       use: [
         'html-loader'
     ],
     // do not process the template with html-loader, since this breaks
     // template variables, e.g. title
     exclude: __dirname + '/index.html'
     }
      ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            title: 'DeepBach',
            favicon: 'images/favicon.ico'
        }),
        new webpack.ProvidePlugin({
        // this allows to use JQuery plugin by calling `require('plugin-name')`
        // as it provides a global JQuery
        // TODO(theis, maybe): alternative method
        // http://reactkungfu.com/2015/10/integrating-jquery-chosen-with-webpack-using-imports-loader/
            $: 'jquery',
            jQuery: 'jquery'
        }),
	//example on how to add ressources
      new CopyWebpackPlugin([
          {from: './js/justindomingue-ohSnap-3ef7eb5/ohsnap.min.js',
           to: 'js/ohsnap.min.js'},
          {from: './tonejs-instruments/samples/organ',
           to: 'tonejs-instruments/samples/organ'},
          {from: './tonejs-instruments/samples/harmonium',
           to: 'tonejs-instruments/samples/harmonium'},
          {from: './tonejs-instruments/samples/xylophone',
           to: 'tonejs-instruments/samples/xylophone'}
      ])
    ],

    node: {
      global: true,
      crypto: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  };
}
