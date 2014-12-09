UK General Election 2015 site
==========================

## Developing the app

You need a version of node with the harmony features available (> v0.11). Use something like [n](https://github.com/tj/n) to manage node version on you computer. For example.

```shell
$ npm install n
$ n latest
$ node --version
v0.11.14
```

You'll also need gulp

```shell
$ npm install -g gulp
```

Then clone this app and install the dependencies...

```shell
$ git clone https://github.com/ft-interactive/ge15.git && cd ge15 && npm install
```

The npm install should also kick of a process to also get the bower and gem dependencies.

To run the app in development.

```shell
$ gulp watch
```
