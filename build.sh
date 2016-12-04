#!/bin/bash
NWJS_VERSION="v0.19.0"
TIDDLYSERVER_VERSION="v1.0.0"

NW_DIR="`pwd`/nw.js/"
BUILD_DIR="`pwd`/build"
OUTPUT_DIR="`pwd`/output"

OS_NAME=`uname -s`

os_download() {
    local TARGET=$1 SOURCE=$2
    if [ ${OS_NAME} == 'Linux' ]; then
        wget -O ${TARGET} ${SOURCE}
    elif [ ${OS_NAME} == 'Darwin' ]; then
        curl -o ${TARGET} ${SOURCE}
    else
        echo "unsure what to use for ${OS_NAME}"
        exit
    fi
}

clean() {
    rm -rf $NW_DIR
    rm -rf $BUILD_DIR
    rm -rf $OUTPUT_DIR
}

download() {
    mkdir -p $NW_DIR
    os_download $NW_DIR/linux32.tar.gz https://dl.nwjs.io/$NWJS_VERSION/nwjs-$NWJS_VERSION-linux-ia32.tar.gz
    os_download $NW_DIR/linux64.tar.gz https://dl.nwjs.io/$NWJS_VERSION/nwjs-$NWJS_VERSION-linux-x64.tar.gz
    os_download $NW_DIR/win32.zip      https://dl.nwjs.io/$NWJS_VERSION/nwjs-$NWJS_VERSION-win-ia32.zip
    os_download $NW_DIR/win64.zip      https://dl.nwjs.io/$NWJS_VERSION/nwjs-$NWJS_VERSION-win-x64.zip
    os_download $NW_DIR/osx.zip        https://dl.nwjs.io/$NWJS_VERSION/nwjs-$NWJS_VERSION-osx-x64.zip
    pushd source
    npm install
    popd
}

extract() {
    mkdir -p $BUILD_DIR
    for platform in "linux32" "linux64"; do
        rm -rf $BUILD_DIR/$platform/
        mkdir -p $BUILD_DIR/$platform/
        tar xvzf $NW_DIR/$platform.tar.gz -C $BUILD_DIR/$platform/ --strip-components=1
    done
    
    for platform in "win32" "win64" "osx"; do
        rm -rf $BUILD_DIR/$platform/
        mkdir -p $BUILD_DIR/$platform/
        unzip $NW_DIR/$platform.zip -d $BUILD_DIR/$platform/
        pushd $BUILD_DIR/$platform/
        mv nw*/* . 
        rmdir nwjs-$NWJS_VERSION-*
        popd
    done

}



prepare() {
    for platform in "linux32" "linux64" "win32" "win64" "osx"; do
        cp -r source/* $BUILD_DIR/$platform/
    done;
}

package() {
    mkdir -p $OUTPUT_DIR
    for platform in "linux32" "linux64" "win32" "win64" "osx"; do
        pushd $BUILD_DIR/$platform/
        zip -r $OUTPUT_DIR/$platform-$TIDDLYSERVER_VERSION.zip ./*
        popd
    done;
}

build() {
    clean
    download
    extract
    prepare
    package
}

build
