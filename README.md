# Short Description

rlinks is a link shortening service that can provide compact and easy to share links to web pages, irrespective of the length of the URL locating it. For each requested web page, a random string of a short length (right now, 7) comprising of English alphabet letters (capital and lower cases) and numbers is generated and used to retrieve the web page's URL. Each page will receive a unique random string (we'll call it a short key).

# Setup

Here are a set of instructions to follow to setup the software to run on a local machine. The whole software stack comes in one repository containing the code for both back-end and front-end. Required Node.js modules must be installed via `npm install` for each of the back-end and front-end components separately. There are also `env.example` files for both components of the software with some suggested values already configured (which can be tweaked as desired). To get started after having cloned the repository:

1. run `npm install` in each of the rlinks-backend and rlinks-frontend directories.
2. copy each of the `env.example` files to `.env` files at the root of each directory.
3. add the required configuration (most notably, an existing PostgreSQL database name, username and password are required for the back-end configuration).
4. running `npm run test` from the back-end directory can be used to test if everything is configured correctly.
5. if desired, in the back-end directory run `npm run db:seed` to initialize the database with some sample web pages.
6. run `npm run dev` in the back-end directory to start the back-end server.
7. if the back-end is running on a port other than 3001 (the default value set in the respective back-end `env.example` file), the `package.json` file of the _front-end_ needs to be updated accordingly to proxy requests to the back-end correctly (look for a `proxy` property at the end of the file).
8. run `npm start` in the front-end directory to start the front-end application in development mode.
9. By default, the app must be reachable at `http://localhost:3000`.

# Architecture

This software in its current form is supported by a single-table relational database (provided by PostgreSQL). The main entity is the URL along with the short key assigned to it as well as basic web page meta data. Uniqueness of the generated short key for each URL is enforced by the database engine.

The interface between the database and the rest of the software is provided by the Sequelize ORM package. The basic and only model in the software (model in the sense of the MVC pattern) is called Link which maps to the links table in the database.

On top of the Link model comes the Node.js/Express.js piece which handles the various incoming requests captured by means of a simple API. This piece is also assisted by a number of helper methods with tasks such as validating the given URLs, generating random short keys, and fetching web page meta data. The Node software also tracks the number of times creation of a short key is attempted for a given URL as well as the number of times a shortened URL is visited. It also provides a paginated listing of the previously created short links.

Short links are in the form of app.domain/key. Upon visiting the URL with a valid key, ie., a key formerly generated and assigned to a valid URL by rlinks, the short key is used to index into the database and retrieve the URL for which this key has been generated. If the key is valid, the visit is registered and a redirect HTTP response to the retrieved URL is sent back.

On the client side a React application provides a UI to the link shortening service by communicating with the exposed API on the server side. The UI also provides a simple web form for creating a short link for a valid URL.

# Testing

Tests have been developed and constantly reviewed/refined to facilitate development of the back-end side of the application. The tests have also been extensively used in constant refactoring of the code so as to make it as modular as possible.

# Deployment

There is currently a deployed version of the app reachable at [rlinks.herokuapp.com](https://rlinks.herokuapp.com/). The deployment was initially done manually for testing purposes. The steps included setting up an app on Heroku, setting up the PostgreSQL database service offered by Heroku, configuring the app with the necessary configuration variables like database credentials and other essential configuration variables, moving the main body of the back-end app (augmented with a production build of the front-end app in the designated static directory of the back-end) to a git repository pointing to Heroku, and finally committing and pushing the app to Heroku via git.

In later stages of development the deployment process was automated by means of a primitive Node.js script. A better and more robust script is being developed to do the deployment with a superior approach.