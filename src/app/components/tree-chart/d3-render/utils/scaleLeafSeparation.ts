declare var d3: any


// let mapParse: any
/* Ensure leaf nodes are not overlapping

Finds the smallest vertical distance between leaves
and scales things to a minimum distance so that
branches don't overlap.

Note that this will update the node.x positions
for all nodes found in passed var 'nodes' as well
as update the global 'links' var.

Parameters:
===========
- tree : d3.tree layout (cluster) 
- nodes : d3.tree nodes
- minSeparation : int (default: 22)
                  mininum distance between leaf nodes

Returns:
========
- xscale : d3.scale
           scale for leaf height separation; given the
           svg height, it will scale properly so leaf
           nodes have minimum separation
*/

export function scaleLeafSeparation(treeGlobalObject: any, tree: any, nodes: any, minSeparation = 30) {

    var traverseTree = function (root: any, callback: any) {
        callback(root);
        if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--) {
                traverseTree(root.children[i], callback)
            };
        }
    }

    // get all leaf X positions
    let leafXpos: any[] = [];
    traverseTree(nodes[0], function (node: any) {
        if (!node.children) {
            leafXpos.push(node.x);
        }
    });

    // calculate leaf vertical distances
    let leafXdist: any[] = [];
    leafXpos = leafXpos.sort(function (a, b) { return a - b });
    leafXpos.forEach(function (x, i) {
        if (i + 1 != leafXpos.length) {
            var dist = leafXpos[i + 1] - x;
            if (dist) {
                leafXdist.push(dist);
            }
        }
    })

    var xScale = d3.scale.linear()
        .range([0, minSeparation])
        .domain([0, d3.min(leafXdist)])

    traverseTree(nodes[0], function (node: any) {
        node.x = xScale(node.x)
    })

    treeGlobalObject.links = tree.links(nodes);

    return xScale;
}
