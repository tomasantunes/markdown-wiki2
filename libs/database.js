var mysql = require('mysql2');
var mysql_async = require('mysql2/promise');
var secretConfig = require('../secret-config.json');

let con;
let con2;

async function getMySQLConnections() {
  if (!con || !con2) {
    // Global variables
    var environment = secretConfig.ENVIRONMENT;

    // Function that performs a few queries to increase the timeout of the database connection
    function increaseTimeout() {
      con2.query('SET GLOBAL connect_timeout=28800')
      con2.query('SET GLOBAL interactive_timeout=28800')
      con2.query('SET GLOBAL wait_timeout=28800')
    }

    // Function that starts the database connection depending on the environment and host
    function startDatabaseConnection(db_host) {
      if (environment == "DOCKER") {
        con = mysql.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: secretConfig.DB_PORT
        });

        con2 = mysql_async.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: secretConfig.DB_PORT
        });
      }
      else if (environment == "UBUNTU") {
        con = mysql.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: '/var/run/mysqld/mysqld.sock'
        });

        con2 = mysql_async.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: '/var/run/mysqld/mysqld.sock'
        });
      }
      else if (environment == "WINDOWS") {
        con = mysql.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: 3306
        });

        con2 = mysql_async.createPool({
          connectionLimit : 90,
          connectTimeout: 1000000,
          host: db_host,
          user: secretConfig.DB_USER,
          password: secretConfig.DB_PASSWORD,
          database: secretConfig.DB_NAME,
          port: 3306
        });
      }
    }

    // Function that checks if the application is running in a Docker container through the environment variable and gets the docker host if it is running on Docker.
    checkDocker = () => {
      return new Promise((resolve, reject) => {
          if (secretConfig.ENVIRONMENT == "DOCKER") {
              getDockerHost((error, result) => {
                  if (result) {
                      resolve(result);
                  } else {
                      reject(error);
                  }
              });
          } else {
              resolve(null);
          }
      });
    };

    // Check if the application is running in a Docker container and start the database connection
    try {
      var docker_host = await checkDocker();
      if (docker_host) {
        console.log('Docker host is ' + docker_host);
        startDatabaseConnection(docker_host);
        increaseTimeout();
      } else {
        console.log('Not in Docker');
        console.log("DB_HOST: " + secretConfig.DB_HOST);
        startDatabaseConnection(secretConfig.DB_HOST);
        increaseTimeout();
      }
    } catch (error) {
      console.log('Error connecting to database:', error);
      return null;
    }
  }
  
  return {con, con2};
}

module.exports = {
    getMySQLConnections,
    default: {
        getMySQLConnections
    }
};