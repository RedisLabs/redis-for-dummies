#!/bin/bash

# Create the clusters with the mock username of r@r.com and the admin password of “test”
docker exec -it rp1 /opt/redislabs/bin/rladmin cluster create name cluster1.local username r@r.com password test
docker exec -it rp2 /opt/redislabs/bin/rladmin cluster create name cluster2.local username r@r.com password test