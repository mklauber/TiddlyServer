(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs             = require("fs"),
    http           = require('http'),
    httpProxy      = require('http-proxy'),
    HttpProxyRules = require('http-proxy-rules'),
    path           = require("path"),
    url            = require("url");

var Server = function() {
    var parentDir   = path.dirname(process.argv[1]);
    
    this.socketDir  = path.join(parentDir,'../', 'sockets/');
    this.configFile = path.resolve('config.json');
    this.config     = fs.existsSync(this.configFile) ? require(this.configFile) : {};
    this.servers    = {};
    this.proxy      = httpProxy.createProxy();
    this.proxyRules = {'rules':{}};
    
    // The actual proxyRules object that we use.  
    this.proxyRuleObj = new HttpProxyRules(this.proxyRules);
    
    // Make the socket directory
    try {
        fs.mkdirSync(this.socketDir);
    } catch (err) {}
    
    // Start all servers in the config file.
    for (var key in this.config) {
        this.add(key, this.config[key]['path']);
    }
    
};

Server.prototype.add = function(prefix, wikiPath) {
    console.log("Starting server at " + prefix + " for " + wikiPath);
    
    this.config[prefix] = {'path': wikiPath}
    
    var socketPath = path.join(this.socketDir, prefix);
    
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

Server.prototype.remove = function(prefix) {
    this.servers[prefix].unixServer.server.close();
    
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


