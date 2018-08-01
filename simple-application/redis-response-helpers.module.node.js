// Closure that returns an error and response handler to be placed as a callback on a Redis function
function sc404onRedis0Result(res,next) {                                                // Status Code 404 (not found) on Redis result of 0. Needs the response object and next middleware
  return function(err,results) {                                                        // returns an error-first callback
    if (err) { next(err); } else {                                                      // if there is an error, pass it and Express will generate an error page with the error details
      if (Number(results) === 0) {                                                      // No errors, but a `result` is an 0. Casting to a number as it can return 0 as a number or string in different situations
        res.status(404).end();                                                          // status code 404 (not found) and end the route
      } else {
        next();                                                                         // otherwise, we just go on to the next middleware
      }
    }
  };
}

// Closure that returns an error and response handler to be placed as a callback on a Redis function
function sc404onRedisNullResult(res,next) {                                             // Status Code 404 (not found) on Redis result of nil/null. Needs the response object and next middleware
  return function(err,results) {                                                        // returns an error-first callback
    if (err) { next(err); } else {                                                      // if there is an error, pass it and Express will generate an error page with the error details
      if (results === null) {                                                           // No errors, but a `result` is null. 
        res.status(404).end();                                                          // status code 404 (not found) and end the route
      } else {
        next();                                                                         // otherwise, we just go on to the next middleware
      }
    }
  };
}


// Closure that handles successful results. To be placed as a callback on a Redis function
function sc200OnRedisSuccess(res,next,opts) {                                           // Status Code 200 (success). Needs the response object an the next middleware
  return function(err,results) {                                                        // returns an error-first callback
    if (err) { next(err); } else {                                                      // if there is an error, pass it and Express will generate an error page with the error details
      if (opts && opts.sendResult) {                                                    // Want to send the result?
        res.send(results);                                                              // express will render the results as JSON
      } else if (opts && opts.data) {                                                   // Want to send data that isn't the result?
        res.send(opts.data);                                                            // express will render the data as JSON
      } else {                                                                          // otherwise
        res.end();                                                                      // end it.
      }
    }
  };
}


module.exports = {
  sc200OnRedisSuccess     : sc200OnRedisSuccess,
  sc404onRedis0Result     : sc404onRedis0Result,
  sc404onRedisNullResult  : sc404onRedisNullResult
};

