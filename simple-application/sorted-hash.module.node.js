const 
  cuid            = require('cuid'),                                                    // generates a unique string
  express         = require('express'),                                                 // 'express' is the HTTP server framework
  router          = express.Router({ mergeParams: true }),                              // create the subrouter with an option to allow access to _all_ the URL parameters (important for `req.param.base`)
  partial         = require('lodash.partial'),                                          // partial application for functions. Allows for neat tricks to clean up the code a bit.
  rk              = require('rk'),                                                      // concatenates arguments with colons in a Redis standard format keys "looks:like:this"
  responseHelper  = require('./redis-response-helpers.module.node.js'),                 // helpers that cover handling responses and errors from Redis
  detailZSetKeyFn = partial(rk,partial.placeholder,'collection'),                       // will generate a function that makes strings that look like "firstArgument:collection" 
  detailHashKeyFn = partial(rk,partial.placeholder,'details',partial.placeholder);      // will generate a function that makes strings that look like "firstArgument:details:secondArgument" 

let client;                                                                             // `client` into this scope
function setClient(inClient) {                                                          // passed in client is then made available in the scope of this module 
  client = inClient;
}

function sc404AtMissingDetails(req,res,next) {                                          // status code 404, if the details are missing
  client.zscore(                                                                        // ZSCORE: find the score of a member in a sorted set
    detailZSetKeyFn(req.params.base),                                                   // creates 'your-base:collection' string for a key
    req.params.uniqueId,                                                                // grabs the unique ID from the URL
    responseHelper.sc404onRedisNullResult(res,next)                                     // returns a 404 if the score is Null
  );
}

//create
router.post(                                                                            // respond only to HTTP POST
  '/',                                                                                  // require only the base
  express.json(),                                                                       // decode the body of the HTTP request to object and place it in `req.body`
  function(req,res,next) {                                                              // request, response and next middleware
    let uniqueId = cuid();                                                              // create a random string
    client
      .multi()                                                                          // MULTI: start an atomic operation
      .zadd(                                                                            // ZADD: add a member to a sorted set
        detailZSetKeyFn(req.params.base),                                               // creates 'your-base:collection' string for a key
        Date.now(),                                                                     // return a ms precision UNIX Timestamp
        uniqueId                                                                        // the unique value
      )
      .hmset(                                                                           // HMSET: Set multiple hash field value pairs. You can use HSET the same way, but HMSET in this client library automatically converts an object into a pairs
        detailHashKeyFn(req.params.base,uniqueId),                                      // the body as an object
        req.body
      )
      .exec(responseHelper.sc200OnRedisSuccess(res,next,{                               // EXEC: execute the atomic operation & respond with a HTTP 200 response code on success...
        data : { id : uniqueId }                                                        // ... and return the unique ID as the response
      }));
  }
);

//read all (or by range)
router.get(                                                                             // respond only to HTTP GET
  '/:min(\\d+)?/:max(\\d+)?',                                                           // ':min' (optional) enables `req.params.min` and ':max' (also optional) enables `req.params.max` (regular expressions are used to ensure only numbers go into these fields)
  function(req,res,next) {                                                              // request, response and next middleware
    let min = req.params.min ? req.params.min : '-inf';                                 // if min is passed, then use it. Otherwise use '-inf'
    let max = req.params.max ? req.params.max : '+inf';                                 // if max is passed, then use it. Otherwise use '+inf'
    client.zrevrangebyscore(                                                            // ZREVRANGEBYSCORE: return a range of sorted set items by score in highest to lowest order
      detailZSetKeyFn(req.params.base),                                                 // create a string like: 'base:details:uniqueId'
      max,                                                                              // the maximum score to be returned
      min,                                                                              // the minimum score to be returned
      responseHelper.sc200OnRedisSuccess(res,next,{                                     // return a HTTP 200 (success) if the Redis operation succeeds...
        sendResult : true                                                               // ... and return the fields and hashes as an object that will further be turned into *single depth* JSON
      })
    );
  }
);

//read one
router.get(                                                                             // respond only to HTTP GET
  '/:uniqueId',                                                                         // ':uniqueId' enables `req.params.uniqueId`
  sc404AtMissingDetails,                                                                // end early if `req.params.uniqueId` has no score
  function(req,res,next) {                                                              // request, response and next middleware
    client.hgetall(                                                                     // HGETALL: get all the fields/values from a hash. If the hash is very big this could be a problem, but no issue for shorter hashes
      detailHashKeyFn(req.params.base,req.params.uniqueId),                             // create a string like: 'base:details:uniqueId'
      responseHelper.sc200OnRedisSuccess(res,next,{                                     // return a HTTP 200 (success) if the Redis operation succeeds...
        sendResult : true                                                               // ... and return the fields and hashes as an object that will further be turned into *single depth* JSON
      }) 
    );
  }
);



//update
router.patch(                                                                           // respond only to HTTP PATCH
  '/:uniqueId',                                                                         // ':uniqueId' enables `req.params.uniqueId`
  sc404AtMissingDetails,                                                                // end early if `req.params.uniqueId` has no score
  express.json(),                                                                       // decode the body of the HTTP request to object and place it in `req.body`
  function(req,res,next) {                                                              // request, response and next middleware
    client.hmset(                                                                       // HMSET: Set multiple hash field value pairs. You can use HSET, but HMSET in this client library automatically converts an object into pairs
      detailHashKeyFn(req.params.base,req.params.uniqueId),                             // create a string like: 'base:details:uniqueId'
      req.body,                                                                         // the body as an object
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Just return HTTP 200 if we successfully set the fields and values
    );
  }
);

//delete
router.delete(                                                                          // respond only to HTTP DELETE
  '/:uniqueId',                                                                         // ':uniqueId' enables `req.params.uniqueId`
  sc404AtMissingDetails,                                                                // end early if `req.params.uniqueId` has no score
  function(req,res,next) {                                                              // request, response and next middleware
    client
      .multi()                                                                          // MULTI: start an atomic operation
      .unlink(detailHashKeyFn(req.params.base,req.params.uniqueId))                     // UNLINK: removes a key. `detailHashKeyFn` produces a string like: 'base:details:uniqueId'
      .zrem(detailZSetKeyFn(req.params.base),req.params.uniqueId)                       // ZREM: remove an item from the sorted set. `detailHashKeyFn` produces a string like: 'base:details:uniqueId'
      .exec(responseHelper.sc200OnRedisSuccess(res,next));                              // EXEC: execute the atomic operation & respond with a HTTP 200 response code on success
  }
);

module.exports = {
  setClient : setClient,
  router    : router
};
