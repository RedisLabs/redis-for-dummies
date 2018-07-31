#!/bin/bash

# Delete bridge networks if they already exist
docker network rm network1 2>/dev/null
docker network rm network2 2>/dev/null

# Create new bridge networks
docker network create network1 --subnet=172.18.0.0/16 --gateway=172.18.0.1
docker network create network2 --subnet=172.19.0.0/16 --gateway=172.19.0.1

# Start 2 docker containers. Each container is a node in a separate network, the Redis Enterprise dashboard will be at 8445 and 8443 and the redis ports will be at 12000 and 12002
docker run -d --cap-add sys_resource -h rp1 --name rp1 -p 8443:8443 -p 9443:9443 -p 12000:12000 --network=network1 --ip=172.18.0.2 --rm redislabs/redis
docker run -d --cap-add sys_resource -h rp2 --name rp2 -p 8445:8443 -p 9445:9443 -p 12002:12000 --network=network2 --ip=172.19.0.2 --rm redislabs/redis

# Connect the networks
docker network connect network2 rp1
docker network connect network1 rp2