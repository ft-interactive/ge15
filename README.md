# UK 2015 election site [![Codeship Status for ft-interactive/ge15](https://codeship.com/projects/345102d0-585d-0130-1abe-123138152df8/status)](https://codeship.com/projects/1503)

## Developing the app

You only need to do steps 1-5 the first time you install. Then repeat step 6 during development.

### 1. Get the correct version of node

Ensure you have version 0.11.13 of Node.js.

As this is an unstable version, it's recommended that you do not simply upgrade node but use a version manager to switch to the require version. 

The [n](https://github.com/tj/n) package is perfect for this.

```shell
$ sudo npm install -g n
$ sudo n 0.11.13
$ node --version
v0.11.13
```

### 2. Install gulp

You'll also need [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) to build the project and run the app in development.

```shell
$ sudo npm install -g gulp
```

### 3. Clone this repo

Next, clone this app and install the dependencies...

```shell
$ git clone https://github.com/ft-interactive/ge15.git && cd ge15 && npm install
```

The npm install should also kick of a process to also get the bower and gem dependencies.

### 4. Get a database

Ensure you have [postgres installed](http://postgresapp.com/), including configuring your path to allow use of the [command line](http://postgresapp.com/documentation/cli-tools.html) utilities.

Then create a local database by running the script in this project:

```
$ ./createdb.sh
```

This will create a local db called ge15. Now fill it with some data.

```
$ DATABASE_URL=postgres://`whoami`@localhost:5432/ge15 node --harmony server/data/load
```

### 5. Create a `.env` file

To begin with you just need to point the app a your database.

```
$ echo "DATABASE_URL=postgres://`whoami`@localhost:5432/ge15" > .env
```

### 6. Run the app in dev mode.

To run the app locally (in development mode) and watch for file changes do this:

```shell
$ gulp watch
```

The browser will reload when there are serverside code changes, client JS changes or CSS/SASS changes.

### Also...

If you want to see the app working locally as it would run on the server do this:

```shell
$ npm run local
```

## Build and Deploy

You cannot use Heroku's git interface for deployment, you also cannot deploy directly to production. Instead we use [Haikro](https://github.com/matthew-andrews/haikro) to make the slug on the [CI server (Codeship)](https://codeship.com/projects/1503) and the deploy to Heroku.

### Codeship (Continuous Integration / CI)

[Codeship](https://codeship.com/projects/1503) watches for git commits on ANY branch and builds the app. The build will pass or fail. The result will be reported on the "election-2015" slack channel.

All successful build on the master branch will get deployed to the [CI instance of the app](http://uk-election-2015-ci.herokuapp.com/).

When what you see in the CI app good to go then you need to promote to production:

```
$ heroku pipeline:promote -a uk-election-2015-ci
```

### Production

The DNS records for http://elections.ft.com points to a Fastly Varnish server.

[Fastly currently routes all traffic](https://app.fastly.com/#configure/service/656lsqYifRuigSP96daQvp) to the main Heroku server:

http://uk-election-2015.herokuapp.com/
