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
        return React.createElement("div", {className: "listItem", 'onClick': self.openWiki, 'key':self.props.title}, 
                 React.createElement("div", {className: "title"}, title),
                 React.createElement("div", {className: "prefix"}, 
                   React.createElement("span", {}, "Available at /" + self.props.prefix)
                 ),
                 React.createElement("div", {className: "deleteButton", "onClick":self.deleteWiki }, "Delete")
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
    add: function() {
        var path   = document.getElementById('selectFolder').value,
            prefix = document.getElementById('selectPrefix').value
        server.add(prefix, path);
        server.save();
        refresh();
    },
    
    componentDidMount: function() {
        document.getElementById('selectFolder').setAttribute('nwdirectory', "");
    },
    
    render: function () {
        return React.createElement("div", {className:"header"}, 
          React.createElement("input", {id:"selectFolder", type:'file', "nwdirectory":"true"}),
          React.createElement("input", {id:"selectPrefix", type:'text'}),
          React.createElement("div", {id:"addButton", onClick:this.add}, "Add")
        );
    }
});

/*
	            <div><input id="selectFolder" type="file" nwdirectory ></input></div>
	            <div ><input id="selectPrefix" type="text"></input></div>
	            <div id="addButton">Add</div>
*/

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

