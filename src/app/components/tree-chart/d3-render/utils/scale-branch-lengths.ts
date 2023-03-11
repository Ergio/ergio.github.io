declare var d3: any



/* Scale tree by distance metric

Will iterate through tree and set the attribute
rootDist (at each node) and will adjust the
y-pos of the tree properly

Parameters:
===========
- nodes : d3.tree nodes
- width : int
          svg width

Returns:
========
- yscale : d3.scale
           horizontal scale for svg
*/

export function scaleBranchLengths(nodes: any, width: number) {
    // Visit all nodes and adjust y pos width distance metric
    var visitPreOrder = function (root: any, callback: any) {
        callback(root)
        if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--) {
                visitPreOrder(root.children[i], callback)
            };
        }
    }
    visitPreOrder(nodes[0], function (node: any) {
        node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
    })
    var rootDists = nodes.map(function (n: any) { return n.rootDist; });

    var yscale = d3.scale.linear()
        .domain([0, d3.max(rootDists)])
        .range([0, width]);

    visitPreOrder(nodes[0], function (node: any) {
        node.y = yscale(node.rootDist)
    })
    return yscale
}