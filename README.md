# redis-for-dummies

This is the source code that accompanies the book _Redis for Dummies_. 

The repo is divided into two sections:

* [simple-application](https://github.com/RedisLabs/redis-for-dummies/tree/master/simple-application), which are bare-bones scripts that illustrate how you can use multiple Redis commands to accomplish a Create-Read-Update-Delete (CRUD) API.
* [crdt application](https://github.com/RedisLabs/redis-for-dummies/tree/master/crdt-application), which is a series of scripts that illustrate the conflict-free replicated data type capabilities of Redis Enterprise.

Both sections are written in Node.js and are designed to run with Redis Enterprise although they will run on Redis open source. The CRDT application will run in open source, but it will not do anything special as the resolution described in the book is based on Redis Entperirse CRDTs.

The sections also make use of bash scripts and assume a unix-like environment. The CRDT application requires Docker.
