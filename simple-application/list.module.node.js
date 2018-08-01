const
  express         = require('express'),                                                 // 'express' is the HTTP server framework
  router          = express.Router({ mergeParams: true }),                              // create the subrouter with an option to allow access to _all_ the URL parameters (important for `req.param.base`)
  responseHelper  = require('./redis-response-helpers.module.node.js');                 // helpers that cover handling responses and errors from Redis

let client;
function setClient(inClient) {                                                          // `client` into this scope
  client = inClient;                                                                    // passed in client is then made available in the scope of this module
}

//list create
router.post(                                                                            // respond only to HTTP PUT
  '/:value',                                                                            // ':value' enables `req.params.value`
  function(req,res,next) {                                                              // request, response and next middleware
    client.lpush(                                                                       // LPUSH: push a value onto a list from the left side
      req.params.base,                                                                  // from the parent router
      req.params.value,                                                                 // from this router
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Just returns HTTP 200 if Redis does not fail (no body).
    );
  }
);
//list read - Get a range or a single value. This can result in very large values on very large lists, but illustrates LRANGE usage
router.get(                                                                             // respond only to HTTP GET
  '/:start?/:stop?',                                                                    // ':start' and ':stop' enable `req.params.start` and `req.params.stop` respectively. They are optional in the URL.
  function(req,res,next) {                                                              // request, response and next middleware
    let start = req.params.start ? req.params.start : 0;                                // If 'start' is passed from the URL, use it. Otherwise, default to 0.
    let stop = req.params.stop ? req.params.stop : -1;                                  // If 'stop' is passed from the URL, use it. Otherwise, default to -1.
    client.lrange(                                                                      // LRANGE: get the range of items from a list
      req.params.base,                                                                  // from the parent router
      start,                                                                            // A start of 0 represents the begining of the list       
      stop,                                                                             // A end of -1 represents the end of the list
      responseHelper.sc200OnRedisSuccess(res,next,{                                     // Return HTTP 200 with the results returned from Redis
        sendResult : true 
      })
    );
  }
);
//list update
router.put(                                                                             // respond only to HTTP PUT
  '/:index/:value',                                                                     // ':index' enables `req.params.index`, ':value' enables `req.params.value`
  function(req,res,next) {                                                              // request, response and next middleware
    client.lset(                                                                        // LSET: set an value at an index in a list
      req.params.base,                                                                  // from the parent router
      req.params.index,                                                                 // from this router - the index of the item you want to update
      req.params.value,                                                                 // from this router - the new value you want to replace at index
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Just returns HTTP 200 if Redis does not fail (no body).
    );
  }
);
//list delete
router.delete(                                                                          // respond only to HTTP DELETE
  '/:value',                                                                            // ':value' enables `req.params.value`
  function(req,res,next) {                                                              // request, response and next middleware
    client.lrem(                                                                        // LREM: remove a value(s) at an index
      req.params.base,                                                                  // from the parent router
      1,                                                                                // since lists can have repeats, we can remove multiples, in this case we'll just remove one though
      req.params.value,                                                                 // from this router - the value you want remove
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Just returns HTTP 200 if Redis does not fail (no body).
    );
  }
);


module.exports = {
  setClient : setClient,
  router    : router
};