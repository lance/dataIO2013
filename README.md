# Vert.x: Async Data From Cluster to Browser

## Chariot Data IO conference, October 2013.

To run this presentation, you need to have [Vert.x](http://vertx.io)
installed on your computer, and a running mongo server. Then simply run:

    $ vertx run --clustered preso.js 

Then browse to [http://localhost:8080](http://localhost:8080/vote.html)
to view the presentation slides or head over to the 
[demo](http://localhost:8080/vote.html) to see some Vert.x in action.

If you want to hack the demo election, run the cluster node as its
own verticle.

    $ vertx run --clustered cluster_node.js
