// without these React blows up
global.document = window.document;
global.navigator = window.navigator;

var React = require("react");
var ReactDOM = require("react-dom");


var ListItem = React.createClass({
  openWiki: function() {
    var open = require('open');
    open('http://localhost:8080/' + this.props.prefix);
  },

  deleteWiki: function(event) {
    event.stopPropagation();
    server.remove(this.props.prefix);
    server.save();
    refresh();
  },

  render: function() {
    var self = this,
        title = this.props.server.wiki.renderTiddler('text/plain', '$:/SiteTitle');
    return React.createElement("div", {className: "listItem", 'key':self.props.title},
             React.createElement("div", {className: "title", 'onClick': self.openWiki}, title),
             React.createElement("div", {className: "prefix", 'onClick': self.openWiki},
               React.createElement("span", {}, "Available at /" + self.props.prefix)
             ),
             React.createElement("span", {className: "delete button", "onClick":self.deleteWiki }, "Delete"),
             React.createElement("span", {className: "export button"}, "Export")
           );
  }
});


var List = React.createClass({
  displayName: 'List',
  render: function() {
    var listItems = this.props.wikis.map(function(wiki) { return React.createElement(ListItem, wiki) });
    return React.createElement("div", {}, listItems);
  }
});


var Header = React.createClass({
  add: function(path) {
    var prefix = document.getElementById('selectPrefix').value;
    if (prefix === "") {
      return;
    }
    server.add(prefix, path);
    server.save();
    refresh();
  },

  addFile: function() {
    var self = this;
    var chooser = document.querySelector('#fileInput');
    chooser.addEventListener("change", function(evt) {
      self.add(this.value);
    }, false);

    chooser.value = null;
    chooser.click();
  },

  addFolder: function() {
    var self = this;
    var chooser = document.querySelector('#folderInput');
    chooser.addEventListener("change", function(evt) {
      self.add(this.value);
    }, false);

    chooser.value = null;
    chooser.click();
  },


  componentDidMount: function() {
    document.getElementById('folderInput').setAttribute('nwdirectory', "");
  },

  render: function () {
    return React.createElement("div", {className:"header"},
      React.createElement("span", {style:{float:"left"}}, "Prefix"),
      React.createElement("input", {id:"selectPrefix",
                                    type:'text',
                                    style:{float:"left"}}),
      React.createElement("input", {id:"folderInput",
                                    type:'file',
                                    style:{display: "none"}}),
      React.createElement("input", {id:"fileInput",
                                    type:'file',
                                    style:{display: "none"}}),
      React.createElement("span", {id:"selectFolder",
                                   className:"button",
                                   onClick: this.addFolder}, "Add Folder"),
      React.createElement("span", {id:"selectFile",
                                   className:"button",
                                   onClick: this.addFile}, "Add File")
    );
  }
});


var Page = React.createClass({
    render: function () {
        return React.createElement("div", {id:"content"},
            React.createElement(Header, {}),
            React.createElement(List, this.props)
        );
    }
});


var refresh = function() {
    var props = Object.keys(server.servers).map(function(key) { return {'prefix': key, 'server': server.servers[key] } })
    ReactDOM.render(
        React.createElement(Page, {'wikis': props }),
        document.getElementById('content')
    );
}

refresh();
