(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs             = require("fs-extra"),
    http           = require('http'),
    httpProxy      = require('http-proxy'),
    HttpProxyRules = require('http-proxy-rules'),
    path           = require("path"),
    spawnSync      = require("child_process").spawnSync,
    tiddlywikiPath = require.resolve("tiddlywiki/tiddlywiki.js"),
    url            = require("url");

var Server = function() {
  var parentDir   = nw.App.dataPath;

  this.socketDir  = path.join(parentDir, 'sockets/');
  this.wikiDir    = path.join(parentDir, 'wikis/');
  this.configFile = path.join(parentDir, 'config.json');
  this.config     = fs.existsSync(this.configFile) ? require(this.configFile) : {};
  this.servers    = {};
  this.proxy      = httpProxy.createProxy();
  this.proxyRules = {'rules':{}};

  // The actual proxyRules object that we use.
  this.proxyRuleObj = new HttpProxyRules(this.proxyRules);


  // Make the socket directory
  fs.mkdirsSync(this.socketDir);

  // Make the wiki directory
  fs.mkdirsSync(this.wikiDir);

  this.save()

  // Start all servers in the config file.
  for (var key in this.config) {
      this.start(key, this.config[key]['path']);
  }
};

Server.prototype.start = function(prefix) {
  var socketPath = path.join(this.socketDir, prefix);
  var wikiPath   = path.join(this.wikiDir, prefix);
  console.log("Starting server at " + prefix + " for " + wikiPath);

  // Create the server on a unix socket path
  var $tw = require("tiddlywiki/boot/bootprefix.js").bootprefix();
  delete $tw.browser;
  var server = require("tiddlywiki/boot/boot.js").TiddlyWiki($tw);
  server.boot.argv = [wikiPath, '--unixserver', socketPath]
  server.boot.boot();

  // Save the server to the object, so we can shut it down later if needed.
  this.servers[prefix] = server;
  // Setup the proxy rules to route to the correct location.
  this.proxyRules.rules["/" + prefix] = {socketPath: socketPath};
};


Server.prototype.add = function(prefix, wikiPath) {
  var stats = fs.lstatSync(wikiPath);
  if(stats.isFile()) {
    // Create a wiki Folder
    spawnSync('nodejs', [tiddlywikiPath, path.join(this.wikiDir, prefix),
                     '--init', 'server'], {shell:true})


    // Import tiddlers from Wiki File.
    spawnSync('nodejs', [tiddlywikiPath, '--load', "'" + wikiPath + "'",
                        '--rendertiddlers',
                          '"[all[tiddlers]] -[prefix[$:/state/]] -[prefix[$:/temp/]]"',
                          '$:/core/templates/tid-tiddler',
                          "'" +path.join(this.wikiDir, prefix, 'tiddlers') + "'",
                          'text/vnd.tiddlywiki',
                          '.tid',
                          'noclean'], {shell:true})

  } else if(stats.isDirectory()) {
    fs.copySync(wikiPath, path.join(this.wikiDir, prefix));
  } else {
    throw new TypeError("I Don't know what kind of file this is.");
  }

  // Configure tiddlyweb host settings
  var tiddlerDir = path.join(this.wikiDir, prefix, 'tiddlers')
  fs.mkdirsSync(tiddlerDir)
  fs.writeFileSync(path.join(tiddlerDir, '$__config_tiddlyweb_host.tid'),
           'title: $:/config/tiddlyweb/host\ntype: text/vnd.tiddlywiki\n\n' +
           '$protocol$//$host$/' + prefix + '/')

  this.config[prefix] = true;
  this.start(prefix);
};

Server.prototype.export = function(prefix, dest) {
  console.log(prefix);
  console.log(tiddlywikiPath);
  console.log(path.join(this.wikiDir, prefix));
  spawnSync('nodejs', [tiddlywikiPath,
                       path.join(this.wikiDir, prefix),
                       "--rendertiddler",
                       "'$:/core/save/all'",
                       dest,
                       "text/plain"], {shell:true});
};


Server.prototype.remove = function(prefix) {
  this.servers[prefix].unixServer.server.close();

  fs.removeSync(path.join(this.wikiDir, prefix));
  delete this.config[prefix];
  delete this.servers[prefix];
  delete this.proxyRules.rules["/" + prefix];
};

Server.prototype.save = function(path){
  var savePath = path || this.configFile,
      output   = JSON.stringify(this.config, null, 4);
  console.log(output);
  fs.writeFileSync(this.configFile, output);
};


Server.prototype.listen = function(port, host) {
  var self = this,
      port = port || 8080,
      host = host || '127.0.0.1';
  this.server = http.createServer(function(req, res) {
    // a match method is exposed on the proxy rules instance
    // to test a request to see if it matches against one of the specified rules
    var target = self.proxyRuleObj.match(req);
    if (target) {
        return self.proxy.web(req, res, {
            target: target
        });
    }

    res.write("<html><body>Wiki " + url.parse(req.url).pathname + " does not exist. <br />");
    res.write("Known wikis are. <br />");
    for (var k in self.servers){
        res.write("<a href='/" + k + "/'>" + k + "</a><br />");
    }
    res.write("</body></html>");
      res.end();
  });
  this.server.listen(port, host);
};

exports.Server = Server;

})();
