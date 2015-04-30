# UK 2015 election site [![Codeship Status for ft-interactive/ge15](https://codeship.com/projects/ccdfeaa0-b78b-0132-419f-769425029524/status)](https://codeship.com/projects/71281)

## Initial setup

You only need to do steps 1-4 the first time you install.

### 1. You need io.js

Ensure you have the latest version of io.js, we're not using node anymore. It's recommended that you use a node version manager when running locally. The [n](https://github.com/tj/n) package is perfect for this.

```shell
$ sudo npm install -g n
$ sudo n io latest
$ node --version
v1.8.1
```

### 2. Install gulp

[gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) is used to build the project and run the app in development. Here's how to install it:

```shell
$ sudo npm install -g gulp
```

### 3. Clone this repo

Clone this app and install the dependencies...

```shell
$ git clone https://github.com/ft-interactive/ge15.git && cd ge15 && npm install
```

The npm install will also kick of the bower install process.

### 4. Create a `.env` file

This file contains environment settings that change depending on where and when the app is running.

For example API keys, service end points and tokens will be stored here. This file is not ignored from git so these details are kept secret.

On localhost and each individual server (CI, Prod etc) these values will be different.

## Coding (on local, in dev mode)

### `npm run watch`

To run the app locally (in development mode) and watch for file changes do this:

```shell
$ npm run watch
```

The browser will reload when there are serverside code changes, client JS changes or CSS/SASS changes.

### Do your work in branches

To get code onto the master branch:

1. Work in a [short-lived branch](https://guides.github.com/introduction/flow/). Creating these via Github is easy.
2. Push your changes to github frequently. Rebase to origin/master often and squash commits.
3. Create a pull request when you are done. Give the PR a short commit message that summarises the work you did on the branch.
4. Get someone else to review and merge the branch. If the project is successfully building and passing tests in CI (codeship) then this will be as easy for them as reading the git diffs and clicking the green merge button.
5. Delete the branch.

### Libraries

* [don't use jQuery](http://origami.ft.com/docs/3rd-party-a-list/#why-not-jquery)
* we use [Swig for templates](http://paularmstrong.github.io/swig/)
* use d3 anywhere by just requiring it... `var d3 = require('d3');`
* make use of [Origami modules](http://registry.origami.ft.com/components)!
* use the [image service](http://image.webservices.ft.com/v1/)
* the [Polyfill service](http://polyfill.webservices.ft.com/v1/docs/features/) is already available on the page. lean on it. use modern APIs
* use promises (via the polyfill service) often
* remember to make "core" and "enhanced" experiences. use this to rationalise testing and how you think about browser feature support. IE8 is core. IE9 is enhanced.


### Also...

If you want to see the app working locally as it would run on the server do this:

```shell
$ npm run local
```

## Build and Deploy

You cannot use Heroku's git interface for deployment, you also cannot deploy directly to production. Instead we use [Haikro](https://github.com/matthew-andrews/haikro) to make the slug on the [CI server (Codeship)](https://codeship.com/projects/71281) and the deploy to Heroku.

### Codeship (Continuous Integration / CI)

[Codeship](https://codeship.com/projects/71281) watches for git commits on ANY branch and builds the app. The build will pass or fail. The result will be reported on the "election-2015" slack channel.

All successful build on the master branch will get deployed to the [CI instance of the app](http://uk-election-2015-ci.herokuapp.com/). When what you see in this app is good enough to go live then you need to promote to the CI app to Production:

```shell
$ heroku pipeline:promote -a uk-election-2015-ci
```

### Production

The DNS records for http://elections.ft.com point to a Fastly Varnish server.

[Fastly currently routes all traffic](https://app.fastly.com/#configure/service/656lsqYifRuigSP96daQvp) to the main Heroku server:

http://uk-election-2015.herokuapp.com/
