const parse = require('./bootstrap');
const fs = require('fs');
const path = require('path');


TEST_DIR = path.dirname(__filename) + '/../tests';

fs.readdirSync(TEST_DIR).forEach(file => {
    console.log(file);
})
