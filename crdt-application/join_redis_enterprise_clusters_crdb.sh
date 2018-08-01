#!/bin/bash

# create the CRDB named "mycrdb" and join the clusters
docker exec -it rp1 /opt/redislabs/bin/crdb-cli crdb create --name mycrdb --memory-size 512mb --port 12000 --replication false --shards-count 1 --instance fqdn=cluster1.local,username=r@r.com,password=test --instance fqdn=cluster2.local,username=r@r.com,password=test