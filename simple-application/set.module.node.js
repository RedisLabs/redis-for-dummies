const
  express         = require('express'),                                                 // 'express' is the HTTP server framework
  router          = express.Router({ mergeParams: true }),                              // create the subrouter with an option to allow access to _all_ the URL parameters (important for `req.param.base`)
  responseHelper  = require('./redis-response-helpers.module.node.js');                 // helpers that cover handling responses and errors from Redis

let client;                                                                             // `client` into this scope
function setClient(inClient) {                                                          // passed in client is then made available in the scope of this module
  client = inClient;
}

// create a member in a set with REST
// PUT /mybase/mymember = SADD mybase mymember
router.put(                                                                             // respond only to HTTP PUT
  '/:member',                                                                           // ':member' enables `req.params.member`
  function(req,res,next) {                                                              // request, response and next middleware
    client.sadd(                                                                        // add a member to a set
      req.params.base,                                                                  // from the parent router
      req.params.member,                                                                // from this router
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Just returns HTTP 200 if Redis does not fail (no body).
    );
  }
);
// "read" an item from a set, but really determine if it exists in a set
// GET /mybase/mymember = SISMEMBER mybase mymember
router.get(                                                                             // respond only to HTTP GET
  '/:member',                                                                           // ':member' enables `req.params.member`
  function(req,res,next) {                                                              // request, response and next middleware
    client.sismember(                                                                   // is a member of a set
      req.params.base,                                                                  // from the parent router
      req.params.member,                                                                // from this router
      responseHelper.sc404onRedis0Result(res,next)                                      // Returns 404 if returned result from Redis is 0, otherwise pass to next middleware
    );
  },
  function(req,res,next) {                                                              // request, response and next middleware
    res.status(200).end();                                                              // Just return HTTP 200 because we know it didn't fail in the last middleware
  }
);
// "Read" all items from a set. Note this is good for small sets only
// GET /mybase = SMEMBERS mybase
router.get(                                                                             // respond only to HTTP GET
  '/',
  function(req,res,next) {                                                              // request, response and next middleware
    client.smembers(                                                                    // get all members from a set
      req.params.base,                                                                  // from the parent router
      responseHelper.sc200OnRedisSuccess(res,next,{                                     // Return HTTP 200 with the results returned from Redis
        sendResult : true 
      })                
    );
  }
);
//No update here - doesn't really make sense given the data type

// DELETE /mybase/mymember = SREM mybase mymember
router.delete(                                                                          // respond only to HTTP DELETE
  '/:member',                                                                           // ':member' enables `req.params.member`
  function(req,res,next) {                                                              // request, response and next middleware
    client.srem(                                                                        // remove a member from a set
      req.params.base,                                                                  // from the parent router
      req.params.member,                                                                // from this router
      responseHelper.sc200OnRedisSuccess(res,next)                                      // Return HTTP 200 with the results returned from Redis
    );
  }
);

module.exports = {
  setClient : setClient,
  router    : router
};
