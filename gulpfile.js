const gulp = require("gulp");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const runSequence = require("run-sequence");
const path = require('path');
const gutil = require("gulp-util");

const dirSync = require("gulp-directory-sync");

const CreateServer = require("./gulp-subtasks/build-server");
const CreateClient = require("./gulp-subtasks/build-client");

var ignore = [
    "tsconfig.json",
    /^(.*\.((tsx|ts)$))$/i
];

// Sincs client-side files to the build directory.
// For example, this includes html, css files.
gulp.task('sync', function()
{
    return gulp.src("")
        .pipe(dirSync("client", "build/client",
        {
            printSummary: true,
            ignore: ignore//,
           // nodelete: true
        }));
});

gulp.task('build-client', function(callback) {
    CreateClient(callback);
});

gulp.task("client-all", function(callback) {
    runSequence('sync', 'build-client', callback);
});
