const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const path = require('path');
const gutil = require("gulp-util");
const { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
const StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;

function Webpack(callback) {
    var webpackConfig = {
        context: __dirname + "/../",
        entry: "./client/main.tsx",
        output: {
            path: path.resolve('build/client'),
            filename: "[name].js", //  "[name].[hash].js",
        },

        stats: {
            errorDetails: true,
        },

        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },

        module: {
            loaders: [
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                { test: /\.tsx?$/, loader: "awesome-typescript-loader?configFileName=./client/tsconfig.json" },
                { enforce: 'pre', test: /\.js$/, loader: "source-map-loader" },
            ],
        },

        plugins: [
           // new webpack.DefinePlugin(config),
            new CheckerPlugin(),
           /* new HtmlWebpackPlugin({
               template: './client/index.hdb',
               filename: 'index.hdb',
               hash: true
           }),*/
           new StatsWriterPlugin({
               filename: path.join("..", "stats.json"),
                   
            })
        ],

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            "react-dom": "ReactDOM",
            "jquery": "$",
            "node.extend": "ERROR"
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
    Webpack(callback);
}