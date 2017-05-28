const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const path = require('path');
const gutil = require("gulp-util");

function compileTypescript(callback) {
    var webpackConfig = {
        context: __dirname + "/../",
        entry: "./server/main.tsx",
        output: {
            path: path.resolve('build/server'),
            filename: "[name].js",
        },

        module: {
            loaders: [
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                { test: /\.tsx?$/, loader: "awesome-typescript-loader?configFileName=./server/tsconfig.json" },
                { test: /\.json$/, loader: 'json-loader' },
                { enforce: 'pre', test: /\.js$/, loader: "source-map-loader" },
            ],
        },

        plugins: [
           // new webpack.DefinePlugin(config),
            new HtmlWebpackPlugin({
               template: './client/index.html',
               filename: 'index.html',
               hash: true
           })
        ],

        node: {
            console: true,
            fs: true,
            net: 'empty',
            tls: 'empty'
        }
    };

  //  if (mode == 'dev')
    //    webpackConfig.devtool = 'source-map'; // Enable sourcemaps for debugging webpack's output.

    webpack(webpackConfig, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            // output options
        }));
        callback();
    });
}

module.exports = function execute(callback) {
    compileTypescript(callback);
}