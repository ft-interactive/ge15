# UK 2015 election site [![Codeship Status for ft-interactive/ge15](https://codeship.com/projects/345102d0-585d-0130-1abe-123138152df8/status)](https://codeship.com/projects/1503)

## Developing the app

Before you start, you must ensure you have version 0.11.13 of Node.js. As this is an unstable version, it's recommended that you do not simply upgrade node but use a version manager to switch to the require version. The [n](https://github.com/tj/n) package is perfect for this.

```shell
$ sudo npm install -g n
$ sudo n 0.11.14
$ node --version
v0.11.13
```

You'll also need gulp to build the project and run the app in development.

```shell
$ sudo npm install -g gulp
```

Next, clone this app and install the dependencies...

```shell
$ git clone https://github.com/ft-interactive/ge15.git && cd ge15 && npm install
```

The npm install should also kick of a process to also get the bower and gem dependencies.

You are now ready to start work. To run the app locally in development do this:

```shell
$ gulp watch
```

If you want to see the app working locally as it would run on the server do this:

```shell
$ npm run local
```
