# TiddlyServer

TiddlyServer is a special purpose Desktop app, designed to facilitate managing multiple instances of TiddlyWiki running as a server.  It does not require internet acess to access the wikis.

TiddlyServer can import both TiddlyWiki files and TiddlyFolder wikis.  For each wiki, you specify a prefix to serve it with and the source to import from.  It will copy the wikis to its own internal store and begin serving them up at http://localhost:8080/{prefix}/.  The export button for each wiki will convert it to a single file wiki.  

# Download and Install

Download the Windows, linux, or Mac binary .zip files from 

https://github.com/mklauber/TiddlyServer/releases

Unzip into a folder and run `TiddlyWiki.app` or or `nw.exe` and for linux `nw`.

# Usage

## Multiple Configurations
To have separate mutliple instances of TiddlyServer (for example, separate Personal and Professional instances), you can pass the `--user-config-dir` argument.  e.g. `/opt/TiddlyServer/nw --data-path=/mnt/data/TiddlyServer/config`.  The property should be a directory to use for holding configuration data.
