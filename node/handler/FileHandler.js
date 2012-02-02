var formidable = require('formidable');
var log4js = require('log4js');
var fileLogger = log4js.getLogger("file");
var async = require("async");
var fs = require("fs");
var path = require("path");

exports.uploadHandler =  function(req, res)
{
  var form = new formidable.IncomingForm();
  form.uploadDir= "../var/tmp";
  
  form.parse(req, function(err, fields, files) 
  { 
    //handle errors
    if(err){
      res.send("Error");
      fileLogger.error(err);
      return;
    }
    
    //check if file was sended correctly
    if(!files["file"]){
      res.send("Error");
      fileLogger.error("File was not uploaded correctly");
      return;
    }
    
    //check if file was sended correctly
    if(!fields["padid"]){
      res.send("Error");
      fileLogger.error("No padid given");
      return;
    }
    
    fileLogger.info("fileupload recieved for pad '"+ fields["padid"] + "', called '" + files["file"].name+ "'");

    var padid = fields["padid"];
    
    async.series([
      //create the files directory
      function(callback){
        fs.mkdir("../var/files", function(err){          
          if(err && err.code != 'EEXIST'){
            callback(err)
          }
          else {
            callback();
          }
        });
      }, 
      //create files directory for this pad
      function(callback){
        fs.mkdir("../var/files/" + padid, function(err){          
          if(err && err.code != 'EEXIST'){
            callback(err)
          }
          else {
            callback();
          }
        });
      }, 
      //move the file
      function(callback){
        fs.rename(files["file"].path, "../var/files/" + padid + "/" + files["file"].name, callback);
      }, 
    ], function(err){
      //handle error
      if(err){
        fileLogger.error(err);  
        res.end("Error");
        return;
      } 
    
      //send the form again
      var filePath = path.normalize(__dirname + "/../../static/uploadform.html");
      res.sendfile(filePath, { maxAge: exports.maxAge });
    });
  });
}

exports.listFiles = function(padid, callback){
  fs.readdir("../var/files/"+padid, function(err, files){
    
    //this folder doesn't exist, thats not a error but there are no files
    if(err && err.code == 'ENOENT'){
      err = null;
      files = [];
    }
    
    callback(err, files);
  });
}
