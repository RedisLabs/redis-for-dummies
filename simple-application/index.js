const
  argv              = require('yargs')                                                  // 'yargs' manages command line arguments
                      .option('connection', { 
                        description   : 'Path to your connection object JSON file' 
                      })
                      .demandOption(['connection'])
                      .argv,
  express           = require('express'),                                               // 'express' is the HTTP server framework
  redis             = require('redis'),                                                 // 'node_redis' is the client library for redis
  
  sortedHashRoutes  = require('./sorted-hash.module.node.js'),                          // these are the routes for a Hash + Zset combination
  listRoutes        = require('./list.module.node.js'),                                 // these are the routes for a list
  setRoutes         = require('./set.module.node.js'),                                  // these are the routes for a set

  connection        = require(argv.connection),                                         // import the connection from the command line and make it into a JS object
  client            = redis.createClient(connection),                                   // create the master client connection to Redis
  keys              = {                                                                 // store our keys in one place
    cars          : 'cars',
    features      : 'features',
    descriptions  : 'cardescriptions'
  },
  server            = express();                                                        // create the server instance

function baseRoute(str) { return '/:base('+str+')'; }                                   // we'll use this syntax sugar to pass in a base route that also determine the root of the redis key

sortedHashRoutes.setClient(client);                                                     // give the clients to the different routes
listRoutes.setClient(client);
setRoutes.setClient(client);

server.use(baseRoute(keys.descriptions),sortedHashRoutes.router);                       // plumb in the sub-routers
server.use(baseRoute(keys.features),listRoutes.router);
server.use(baseRoute(keys.cars),setRoutes.router);

server.listen(3000,function() {                                                         // start the server at port 3000
  console.log('CRUD App Running.');                                                     // notify the console that we're up and ready
});


