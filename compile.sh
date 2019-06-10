#!/bin/bash
tsc
browserify node_modules/es6-promise/auto.js -o bundle.js
