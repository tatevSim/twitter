var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UrlShortener = new Schema({
    shortKey:String,
    url :String
});

var Message = new Schema({
    body:String
});


mongoose.model("UrlShortener", UrlShortener);
mongoose.model("Message", Message);
mongoose.connect("mongodb://localhost/newApp");

module.exports = mongoose;