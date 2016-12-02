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
    if(confirm("Are you sure you want to delete this wiki?")){
      server.remove(this.props.prefix);
      server.save();
      refresh();
    }
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
    return React.createElement("div", {id: "list"}, listItems);
  }
});


var Header = React.createClass({
  add: function(path) {

    server.add(prefix, path);
    server.save();
    refresh();
  },

  addFile: function() {
    var self    = this,
        prefix  = document.getElementById('selectPrefix').value,
        chooser = document.querySelector('#fileInput');

    // Make sure we have a valid prefix first
    if (prefix === "") {
      alert("You must enter a prefix for this wiki.")
      return;
    }

    chooser.addEventListener("change", function(evt) {
      self.add(this.value);
    }, false);

    chooser.value = null;
    chooser.click();
  },

  addFolder: function() {
    var self    = this,
        prefix  = document.getElementById('selectPrefix').value,
        chooser = document.querySelector('#folderInput');

    // Make sure we have a valid prefix first
    if (prefix === "") {
      alert("You must enter a prefix for this wiki.")
      return;
    }

    
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
    return React.createElement("div", {id:"header"},
      React.createElement("span", {}, "Prefix"),
      React.createElement("input", {id:"selectPrefix",
                                    type:'text'}),
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
            React.createElement("div", {id:"offset"}),
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
