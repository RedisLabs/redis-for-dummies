# Simple Redis CRUD Application

## Installation
0. Make sure you have [Node.js installed](https://nodejs.org/en/download/) (version 8 or higher) on your machine. If you have just installed fresh, it's adviseable to close the terminal session after installation and reopen a new one. 
1. Switch into this directory and run `npm install`. This will install the relevant dependencies.
2. Create a connection JSON file based on the [node_redis options structure](https://github.com/NodeRedis/node_redis#options-object-properties). Typically this will include your `host`, `port`, and `password` and will look something like this:
```
{
  "host"  : "1.1.1.1",
  "port"  : 12000,
  "password" : "youshouldalwayshaveapasswordonredis"
 }
 ```
 (Swap the values out above for the relevant information to your Redis Enterprise instance)
 
 
## Running the server
1. Switch into this directory.
2. Run the server
```
$ node index.js --connection /path/to/your/connection.json
```
3. Follow the instructions in the book (Chapter 6) to run the exercises or interact with this server.

