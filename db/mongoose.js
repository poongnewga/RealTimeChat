var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
// mongodb://~~~~~/db명 으로 접속
mongoose.connect('mongodb://localhost:27777/lunchting', {
  useMongoClient: true
});

module.exports = { mongoose };

