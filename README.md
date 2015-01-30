# UK 2015 election site [![Codeship Status for ft-interactive/ge15](https://codeship.com/projects/345102d0-585d-0130-1abe-123138152df8/status)](https://codeship.com/projects/1503)

## Intial setup

You only need to do steps 1-5 the first time you install.

### 1. Get the correct version of node

Ensure you have version 0.11.13 of Node.js.

As this is an unstable version, it's recommended that you do not simply upgrade node but use a version manager to switch to the required version.

The [n](https://github.com/tj/n) package is perfect for this.

```shell
$ sudo npm install -g n
$ sudo n 0.11.13
$ node --version
v0.11.13
```

### 2. Install gulp

[gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) is used to build project and run the app in development.

```shell
$ sudo npm install -g gulp
```

### 3. Clone this repo

Clone this app and install the dependencies...

```shell
$ git clone https://github.com/ft-interactive/ge15.git && cd ge15 && npm install
```

The npm install will also kick of the bower install process.

### 4. Get a database

a) Ensure you have [postgres installed](http://postgresapp.com/)
b) configuring your path to allow use of the [command line](http://postgresapp.com/documentation/cli-tools.html) utilities.
c) create a local database (called ge15): `$ createdb -Eutf8 ge15`
d) Now fill it with some data:

```shell
$ DATABASE_URL=postgres://`whoami`@localhost:5432/ge15 node --harmony server/data/load
```

### 5. Create a `.env` file

To begin with you just need to point the app at your database.

```shell
$ echo "DATABASE_URL=postgres://`whoami`@localhost:5432/ge15" > .env
```

## Coding (on local, in dev mode)

### `gulp watch`

To run the app locally (in development mode) and watch for file changes do this:

```shell
$ gulp watch
```

Then open the site at [localhost:3000](http://localhost:3000/) (unless you've set a different port in your `.env` file). You can also do `$ gulp watch --open` to open your browser automatically when it's ready.

The browser will reload when there are serverside code changes, client JS changes or CSS/SASS changes.

### Do your work in branches

To get code onto the master branch:

1. Work in a short-lived branch. Creating these via Github is easy.
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

You cannot use Heroku's git interface for deployment, you also cannot deploy directly to production. Instead we use [Haikro](https://github.com/matthew-andrews/haikro) to make the slug on the [CI server (Codeship)](https://codeship.com/projects/1503) and the deploy to Heroku.

### Codeship (Continuous Integration / CI)

[Codeship](https://codeship.com/projects/1503) watches for git commits on ANY branch and builds the app. The build will pass or fail. The result will be reported on the "election-2015" slack channel.

All successful build on the master branch will get deployed to the [CI instance of the app](http://uk-election-2015-ci.herokuapp.com/). When what you see in this app is good enough to go live then you need to promote to the CI app to Production:

```shell
$ heroku pipeline:promote -a uk-election-2015-ci
```

### Production

The DNS records for http://elections.ft.com point to a Fastly Varnish server.

[Fastly currently routes all traffic](https://app.fastly.com/#configure/service/656lsqYifRuigSP96daQvp) to the main Heroku server:

http://uk-election-2015.herokuapp.com/
