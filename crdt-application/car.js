const
  requirePlate  = function(yargs) {                                                     // chained argument requirement function
                  return yargs                                                          // pass back for chaining
                    .option('plate', {                                                  // require the argument 'plate' on the command line
                      description   : 'License plate string',                           // displayed in command line help
                      demandOption: true                                                // required
                    });
                },
  argv          = require('yargs')                                                      // `yargs` is a command line argument parsing library
                  .option('connection', {                                               // '--connection' to pass in a path to a JSON file with your Redis connection JSON
                    description   : 'Path to your connection object JSON file'          // displayed in command line help
                  })
                  .demandOption(['connection'])                                         // require 'connection' always
                  .command('enter <road>','Enter a <road>',requirePlate)                // command 'enter': as if a car was entering a highway - also require the plate 
                  .command('exit <road>','Exit a <road>',requirePlate)                  // command 'exit': as if a car was exiting a highway - also require the plate
                  .command('marker <road>','Pass a marker on a <road>',requirePlate)    // command 'marker': as if a car was passing a highway marker -- also require the plate
                  .command('viewroads','view the roads as JSON')                        // command 'viewroads': give a status of the roads as JSON
                  .demandCommand()                                                      // require a command at the command line
                  .argv,
  async         = require('async'),                                                     // `async` is a library for elegantly handling async functions
  rk            = require('rk'),                                                        // `rk` concatenates strings together with colons for redis-style keys
  redis         = require('redis'),                                                     // `redis` is the client libaray for node.js
  connection    = require(argv.connection),                                             // take the connection argument path and require it to return it as an object
  client        = redis.createClient(connection),                                       // create the client library instance with the connection from the JSON file
  command       = argv._,                                                               // underscore from the `argv` in 'yargs' returns the command
  commands      = {},                                                                   // empty object to later populate with the commands from the command line
  keys          = {                                                                     // `keys` keeps all the string literals out of the program
    roads         : 'roads',
    allRoads      : 'all-roads',
    roadMarker    : 'road-marker'
  };

function tagRoad(road) { return '{'+road+'}'; }

function returnResultsAndArugments(commandArgs,cb) {                                    // sugar to handle errors in a callback
  return (err,results) => {
    if (err) { cb(err); } else {                                                        // if we have an error, pass it back to the callback
      cb(err,commandArgs,results);                                                      // if no error, then run the callback with the error (now null),
    }                                                                                   // command arguments, and the result
  } 
}
function addToAllRoads(commandArgs,cb) {                                                // add a road to the all roads set
  client.sadd(keys.allRoads,commandArgs.road,(err) => {                                 // SADD 'all-roads' [road from the command line]
    if (err) { cb(err); } else {                                                        // handle the error
      cb(err,commandArgs);                                                              // if no error, just pass the arguments
    }
  });
}

commands.enter = async.seq(                                                             // `async.seq` creates an async waterfall and returns a function
  addToAllRoads,                                                                        // add the road into the set
  function addToRoad(commandArgs, cb) {
    client.sadd(                                                                        // add to the set
      rk(keys.roads,commandArgs.road),                                                  // at the key roads:[road from the command line] 
      commandArgs.plate,                                                                // the member is the plate from the command line
      returnResultsAndArugments(commandArgs,cb)                                         // hand the error and return back the value
    );
  },
  async.asyncify((commandArgs,resultEnter) => {                                         // `async.asyncify` creates a callback-first function out of a sync function
    return {                                                                            // return back the value in an object form
      road              : commandArgs.road,                                             // the road from the command line
      onRoadPreviously  : resultEnter === 0                                             // coerce and flip `resultEnter` into a true/false (from a 1/0 response from redis)
    };
  })
);

commands.exit = async.seq(                                                              // `async.seq` creates an async waterfall and returns a function
  function exitRoad(commandArgs,cb) {                                                   // remove a road from a set
    client.srem(                                                                        // set remove
      rk(keys.roads,commandArgs.road),                                                  // at the key roads:[road from the command line] 
      commandArgs.plate,                                                                // the member is the plate from the command line
      returnResultsAndArugments(commandArgs,cb)                                         // hand the error and return back the value
    );
  },
  async.asyncify((commandArgs,resultExit) => {                                          // `async.asyncify` creates a callback-first function out of a sync function
    return {                                                                            // return back the value in an object form
      road      : commandArgs.road,                                                     // the road from the command line
      exited    : resultExit === 1                                                      // coerce `resultEnter` into a true/false (from a 1/0 response from redis)
    };
  })
);

commands.marker = async.seq(                                                            // `async.seq` creates an async waterfall and returns a function
  addToAllRoads,                                                                        // add a road to the all roads set
  function addMarker(commandArgs,cb) {                                                  // add a marker to the set and incr the correct plate 
    client
      .multi()                                                                          // create an atomic transaction
      .sadd(rk(keys.roads,tagRoad(commandArgs.road)),commandArgs.plate)                          // add to a set at the key roads:[road from the command line], the member is the plate from the command line
      .hincrby(rk(keys.roadMarker,tagRoad(commandArgs.road)),commandArgs.plate,1)                // increment a hash value at value 'road-marker:[road from the command line], the field is the plate from the command line and the by one step
      .exec(returnResultsAndArugments(commandArgs,cb));                                 // execute the two together
  },
  async.asyncify((commandArgs,addMultiResults) => {                                     // `async.asyncify` creates a callback-first function out of a sync function
    let resultEnter = addMultiResults[0];                                               // the results from the SADD
    let resultIncr = addMultiResults[1];                                                // the results from the hincrby
    return {
      entered           : commandArgs.road,                                             // return back the road
      onRoadPreviously  : resultEnter === 0,                                            // coerce and flip `resultEnter` into a true/false (from a 1/0 response from redis)
      marker            : resultIncr                                                    // return back the current marker (e.g. the results from the hincrby)
    };
  })
);

// this command relies on smembers and is included to illustrate the status in this exercise easily 
// In production code, it would be wise to use a SSCAN command to better handle large sets
commands.viewroads = async.seq(                                                         // `async.seq` creates an async waterfall and returns a function
  function getAllRoads(commandArgs,cb) {                                                // get all the road
    client.smembers(keys.allRoads,returnResultsAndArugments(commandArgs,cb));           // with SMEMBERS from 'all-roads'
  },
  function(commandArgs,roads,cb) {                                                      // get all the values from the roads
    let markerMulti = client.batch();                                                   // create a pipeline
    commandArgs.roads = roads;
    commandArgs.roads.forEach((aRoad) => {                                              // iterate through the roads
      markerMulti.hgetall(rk(keys.roadMarker,tagRoad(aRoad)));                                   // get all the values for each road
    });
    markerMulti.exec(returnResultsAndArugments(commandArgs,cb));                        // execute the pipeline
  },
  async.asyncify((commandArgs,markers) => {                                             // `async.asyncify` creates a callback-first function out of a sync function
    let roadsAndMarkers = {};                                                           // create an empty object that we will populate with the forEach
    commandArgs.roads.forEach((aRoad,roadIndex) => {                                    // iterate through the road marker results               
      roadsAndMarkers[aRoad] = markers[roadIndex];                                      // return the plate and mile marker for each road
    });
    return roadsAndMarkers;
  })
);

if (commands[command]) {                                                                // if the command exists
  commands[command](argv,(err, output) => {                                             // run it with the comand line arguments and a callback
    if (err) { throw err; } else {                                                      // just throw an error if something is wrong (nothing else to do at this point)
      console.log(                                                                      // write out the results
        JSON.stringify(output,null,2)                                                   // with pretty printed JSON
      );
    }
    client.quit();                                                                      // close the client gracefully and end execution
  });
} else {                                                                                // if the command doesn't exist
  console.log('Command "'+command+'" not implemented');                                 // tell the user
  client.quit();                                                                        // close the client gracefully and end execution
}