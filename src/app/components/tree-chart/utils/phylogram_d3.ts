import { colorbrewer } from "./colorbrewer.min"
import { scaleBranchLengths } from "./scale-branch-lengths";

declare var d3: any
declare var jQuery: any

let svg: any


// GLOBALS
// --------------
var options = {} as any;
var mapParse: any
var colorScales: any
var mappingFile: any

// use margin convention
// https://bl.ocks.org/mbostock/3019563
var margin = {top: 0, right: 10, bottom: 10, left: 10};
var startW = 800, startH = 600;
var width = startW - margin.left - margin.right;
var height = startH - margin.top - margin.bottom;
var nodes: any
var links: any
var node: any
var link: any
var newick: any
var shiftX = 0;
var shiftY = 0;
var zoom = d3.behavior.zoom()

// tree defaults
var treeType = 'rectangular'; // rectangular or circular [currently rendered treeType]
var scale = true; // if true, tree will be scaled by distance metric

// scale for adjusting legend
// text color based on background
// [background HSL -> L value]
// domain is L (0,1)
// range is RBG
var legendColorScale = d3.scale.linear().domain([0.5,1]).range([255,0])

var geneDataObj: any = {
    geneData: {}
}

// tooltip


var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0,20])
    .html(function(d: any) {
        return formatTooltip(d, options.mapping);
    })
var outerRadius = startW / 2,
    innerRadius = outerRadius - 170;

// setup radial tree
var radialTree = d3.layout.cluster()
    .size([360, innerRadius])
    .children(function(d: any) { return d.branchset; })

// setup rectangular tree
var rectTree = d3.layout.cluster()
    .children(function(node: any) {
        return node.branchset
    })
    .size([height, width]);

var duration = 1000;

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
function scaleLeafSeparation(tree: any, nodes: any, minSeparation=22) {

    var traverseTree = function(root: any, callback: any) {
        callback(root);
        if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--){
                traverseTree(root.children[i], callback)
            };
        }
    }

    // get all leaf X positions
    let leafXpos: any[] = [];
    traverseTree(nodes[0], function(node: any) {
        if (!node.children) {
            leafXpos.push(node.x);
        }
    });

    // calculate leaf vertical distances
    let leafXdist: any[] = [];
    leafXpos = leafXpos.sort(function(a, b) { return a-b });
    leafXpos.forEach( function(x,i) {
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

    // update node x pos & links
    traverseTree(nodes[0], function(node: any) {
        node.x = xScale(node.x)
    })

    links = tree.links(nodes);

    return xScale;
}


// https://bl.ocks.org/mbostock/c034d66572fd6bd6815a
// Like d3.svg.diagonal.radial, but with square corners.
function step(startAngle: any, startRadius: any, endAngle: any, endRadius: any) {
  var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
      s0 = Math.sin(startAngle),
      c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
      s1 = Math.sin(endAngle);
  return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
}


// http://bl.ocks.org/mbostock/2429963
// draw right angle links to join nodes
function elbow(d: any) {
  return "M" + d.source.y + "," + d.source.x
      + "V" + d.target.x + "H" + d.target.y;
}






/* Master format tree function

Parameters:
===========
- nodes : d3 tree nodes
- links : d3 tree links
- yscale : quantitative scale
           horizontal scaling factor for distance
           if null, ruler is not drawn
- xscale : quantitative scale
           vertical scale
           if null, ruler is not drawn
- height : int
           height of svg
- opts : obj
            tree opts, see documentation for keys

*/
function formatTree(nodes: any, links: any, yscale: any=null, xscale: any=null, height: any, opts: any) {

    /* Format links (branches) of tree
    formatLinks

    Will render the lines connecting nodes (links)
    with right angle elbows.

    Parameters:
    ===========
    - svg : svg selctor
            svg HTML element into which to render
    - links : d3.tree.links
    - opts : obj
                tree opts, see documentation for keys


    */

    // set to global!
    link = d3.select('#treeSVG').selectAll("path.link")
      .data(links)
        .enter().append("path")
        .attr("class","link")
        .style("fill","none") // setting style inline otherwise AI doesn't render properly
        .style("stroke","#aaa")
        .style("stroke-width","2px")

    d3.selectAll('.link')
        .attr("d", function(d: any) { return opts.tree == 'rectangular' ? elbow(d) : step(d.source.x, d.source.y, d.target.x, d.target.y); })


    /* Render and format tree nodes
    formatNodes

    Will render all tree nodes as well as format them
    with color, shape, size; additionally all leaf
    nodes and internal nodes will get labels by default.

    A node is a generalized group which can contain shapes
    (circle) as well as labels (text).

    Parameters:
    ===========
    - svg : svg selctor
            svg HTML element into which to render
    - nodes : d3.tree.nodes
    - opts : obj
                tree opts, see documentation for keys


    */

    // set default leaf radius if not present
    if (!('sliderLeafR' in opts)) {
        opts['sliderLeafR'] = 5;
    }

    node = d3.select('#treeSVG').selectAll("g.node")
            .data(nodes)
          .enter().append("g")
            .attr("class", function(n: any) {
                if (n.children) {
                    if (n.depth == 0) {
                        return "root node"
                    } else {
                        return "inner node"
                    }
                } else {
                    return "leaf node"
                }
            })
            .attr("id", function(d: any) {
                if (!d.children) {
                    var name = d.name.replace(new RegExp('\\.', 'g'), '_');
                    return 'leaf_' + name;
                }
                return undefined
            } as any)

    d3.selectAll('.node')
            .attr("transform", function(d: any) {
                if (opts.treeType == 'rectangular') {
                    return "translate(" + d.y + "," + d.x + ")";
                } else if (opts.treeType == 'radial') {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                }
                return undefined
            } as any)
        
    d3.selectAll('.leaf')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)

    // node backgrounds
    node.append("rect")
      .attr('width', 0 ) // width is set when choosing background color
      .attr('height', 10 + opts.sliderLeafR * 2) 
      .attr('y', -opts.sliderLeafR - 5)
      .attr("opacity", function(d: any) { return d.children ? 1e-6 : 1 });

    // node circles
    node.append("circle")
        .attr("r", function(d: any) { 
            if (!d.children || d.depth == 0) {
                return opts.sliderLeafR;
            } else {
                return 3;
            }
        });


    d3.selectAll('.inner.node circle')
        .on("mouseover", function(e: any) { 
            d3.select(e)
                .transition()
                .duration(100)
                .attr("r",6); 
        })
        .on("mouseout", function(e: any) { 
            d3.select(e)
                .transition()
                .duration(100)
                .attr("r",3); 
        })


    // node label
    node.append("text")
        .attr("class",function(d: any) { return d.children ? "distanceLabel" : "leafLabel" })
        .attr("dy", function(d: any) { return d.children ? -6 : 3 })
        .text(function(d: any) { 
            if (d.children) {
                if (d.length && d.length.toFixed(2) > 0.01) {
                    return d.length.toFixed(2);
                } else {
                    return '';
                }
            } else {
                if (opts['leafText']) {
                    return d.name + ' (' + mapParse.get(opts['leafText']).get(d.name) + ')';
                } else {
                    return d.name + ' (' + d.length + ')';
                }
            }
        })
        .attr("opacity", function(d: any) { return opts.skipLabels ? 1e-6 : 1; })

    orientTreeLabels(); 



    /* Render and format background rules
    formatRuler

    Parameters:
    ===========
    - id : id selector
           id (with #) into which to render ruler
    - yscale : quantitative scale
               horizontal scaling factor for distance
    - xscale : quantitative scale
               vertical scale
    - height : int
               height of svg
    - opts : obj
                tree opts, expects a key hideRuler;
                if true, rules won't be drawn. also
                expects a key treeType (rectangular/radial)

    */


    if (!opts.hideRuler && yscale != null) {

        if (opts.treeType == 'rectangular') {

            let rulerG = d3.select('#rulerSVG').selectAll("g")
                    .data(yscale.ticks(10))
                  .enter().append("g")
                    .attr("class", "ruleGroup")
                  .append('svg:line')
                    .attr("class", "rule")
                    .attr('y1', 0)
                    .attr('y2', getTreeBox().height + margin.top + margin.bottom)
                    .attr('x1', yscale)
                    .attr('x2', yscale)


        } else if (opts.treeType == 'radial') {  

            let rulerG = d3.select('#rulerSVG').selectAll("g")
                    .data(yscale.ticks(10))
                  .enter().append("g")
                    .attr("class", "ruleGroup")
                  .append('circle')
                    .attr("class","rule")
                    .attr('r', yscale);

        }
    }
}






/* Process mapping file into useable format

Function responsible for parsing the TSV mapping
file which contains metadata for formatting the
tree as well as generating color scales
for use in the legend and coloring the tree.

Note that any QIIME formatted taxonomy data
found will automatically be cleaned up removing
the level prefix and splitting the taxonomy on
each level into its own metadata category.  This
allows users to color by a specific taxonomic
level.

It is assumed that the first column in the mapping
file has the same values as the leaf names.

Parameters:
===========
- data: d3.tsv() parsed data
    input mapping file processed by d3.tsv; will be
    an array (where each row in the TSV is an array
    value) of objects where objects have col headers
    as keys and file values as values


Returns:
========
- array
    returns an array of length 2:
    0:  d3.map() of parsed TSV data with file column
        headers as the keys and the values are a d3.map()
        where leaf names are keys (TSV rows) and values
        are the row/column values in the file.
    1:  d3.map() as colorScales where keys are file
        column headers and values are the color scales.
        scales take as input the leaf name (file row)
*/
function parseMapping(data: any) {

    // get mapping file column headers
    // we assume first column is the leaf ID
    var colTSV = d3.map(data[0]).keys();
    var id = colTSV[0];
    colTSV.shift(); // remove first col (ID)

    var mapParse = d3.map(); // {colHeader: { ID1: val, ID2: val } }

    data.forEach(function(row: any) {
        var leafName = row[id];
        colTSV.forEach( function(col: any, i: any) {
            var colVal = cleanTaxa(row[col]);
            let val: any

            if (!mapParse.has(col)) {
                val = d3.map();
            } else {
                val = mapParse.get(col) as any
            }

            if (typeof colVal === 'object') { // if data was taxa info, it comes back as an obj
                for (var level in colVal) {
                    var taxa = colVal[level];
                    if (!mapParse.has(level)) {
                        val = d3.map();
                    } else {
                        val = mapParse.get(level);
                    }
                    val.set(leafName, taxa);
                    mapParse.set(level, val);
                }
            } else {
                val.set(leafName, colVal);
                mapParse.set(col, val);
            }
        })
    })

    // setup color scales for mapping columns
    // keys are mapping column headers and values are scales
    // for converting column value to a color
    var colorScales = d3.map();
    mapParse.forEach(function(k: any, v: any) { // v is a d3.set of mapping column values, with leaf ID has key

        // check if values for mapping column are string or numbers
        // strings are turned into ordinal scales, numbers into quantitative
        // we simply check the first value in the obj
        var vals = autoSort(v.values(), true);
        var scale;
        if (typeof vals[0] === 'string' || vals[0] instanceof String) { // ordinal scale
            var tmp = d3.scale.category10();
            if (vals.length > 10) {
                tmp = d3.scale.category10();;
            }
            scale = tmp.domain(vals);
        } else { // quantitative scale
            scale = d3.scale.quantize()
                .domain(d3.extent(vals))
                .range(colorbrewer.Spectral[11]);
        }
        colorScales.set(k, scale);
    })

    return [mapParse, colorScales];
}








/* Clean-up a QIIME formatted taxa string

Will clean-up a QIIME formatted taxonomy string
by removing the class prefix and returning the
original taxa string as an object split into taxonomic
levels e.g. {"Kingdom":"bacteria", ... }

NOTE: any taxa level with an assignment "unassigned" 
will be thrown out - this way the tree will not
color by this level (tree can only be colored by
defined taxa)

Parameters:
===========
- taxa : string
    QIIME formatted string

Returns:
========
- cleaned string

*/
function cleanTaxa(taxa: any) {

    if ((typeof taxa === 'string' || taxa instanceof String) && taxa.slice(0, 2) == 'k_') {

        var str = taxa.replace(/.__/g, "");

        // some taxa strings end in ';' some don't,
        // remove it if it exists
        if (str.substr(str.length - 1) == ';') {
            str = str.substring(0, str.length - 1);
        }

        var clean = str.split(";");

        var ret: any = {};

        // construct object
        var taxaLevels = ['Taxa [Kingdom]','Taxa [Phylum]','Taxa [Class]','Taxa [Order]','Taxa [Family]','Taxa [Genus]','Taxa [Species]'];
        clean.forEach(function(taxa, i) {
            if (taxa != 'unassigned') {
                ret[taxaLevels[i]] = taxa;
            }
        })

        return ret;

    } else {

        return taxa;

    }

}

// get the viewBox attribute of the outermost svg in
// format {x0, y0, x1, y1}
function getViewBox(): any {
    var vb = jQuery('svg')[0].getAttribute('viewBox');

    if (vb) {
        var arr = vb.split(' ').map(function(d: any) { return parseInt(d); })
        return {'x0':arr[0], 'y0':arr[1], 'x1':arr[2], 'y1':arr[3]};
    } else {
        return false;
    }
}

// get BoundingClientRect of tree
function getTreeBox() {

    if (treeType == 'rectangular') {
        var tmp_height = d3.extent(nodes.map(function(d: any) { return d.x }));
        var tmp_width = d3.extent(nodes.map(function(d: any) { return d.y })); // note width will be off since it doesn't take into account the label text
        return {'height':tmp_height[1] - tmp_height[0], 'width':tmp_width[1] - tmp_width[0] };
    } else {

        return (d3.select('#treeSVG').node() as any).getBoundingClientRect();
    }


}


/*  Automatically sort an array

Given an array of strings, were the string
could be a float (e.g. "1.2") or an int
(e.g. "5"), this function will convert the
array if all strings are ints or floats and
sort it (either alphabetically or numerically
ascending).

Parameters:
===========
- arr: array of strings
    an array of strings
- unique: bool
    default: false
    if true, only unique values will be returned

Returns:
- sorted, converted array, will be either
    all strings or all numbers

*/
function autoSort(arr: any, unique: any=false) {

    // get unique values of array
    // by converting to d3.set()
    if (unique) { arr = d3.set(arr).values(); }

    var vals = arr.map(filterTSVval); // convert to int or float if needed
    var sorted = (typeof vals[0] === 'string' || vals[0] instanceof String) ? vals.sort() : vals.sort(function(a: any,b: any) { return a - b; }).reverse();

    return sorted;

}








// helper function for filtering input TSV values
// will automatically detect if value is int, float or string and return
// it as such
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat
function filterTSVval(value: any) {
    if (parseFloat(value)) { // if float
        return parseFloat(value);
    } else if (parseInt(value)) { // if int
        return parseInt(value);
    }

    // ignore blank values
    if (value != '') {
        return value;
    } else {
        return null;
    }
}




/* Function for styling tooltip content

Parameters:
==========
- d : node attributes

- mapParse : obj (optional)
    optional parsed mapping file; keys are mapping file
    column headers, values are d3 map obj with key as
    node name and value as file value

Returns:
========
- formatted HTML with all node data

*/
function formatTooltip(d: any, mapParse: any) {
    const geneData = geneDataObj.geneData

    var html = ""

    const props = ["GENE_NAME", "CLUSTER", "ORGANISM", "CLUSTER_PRODUCT", "BIOSYNTHETIC_CLASSES", "GENE_PRODUCT", "PROTEIN_ID"]

    props.forEach(function(col: any) {
        html += '<p class="tip-row"><span style="font-weight: 700;" class="tip-meta-title"> ' + col + '</span>: <span class="tip-meta-name">' + geneData[d.name][col] + '</span><p>';
    })
    return html;
}



/* Generate legend

Helper function for generating a legend (floating),
given various inputs.  Legend consists of an overall
'g' group which contains a legend title as well as 
rows of legend elements.  Each row has the class
'legend' and is 'g' group comprised of a shape
and a text element.

Parameters:
===========
- title: string
    title for legend
- mapVals: obj
    d3.map() obj with leaf name as key
    and legend row value as value
- colorScale: d3 color scale
    color scale used with each item in mapVals;
    generates either a circle or a rect with this
    color
- type: string
    type of colored object to render along with
    each item in mapVals; either 'circle' or 'rect'
*/
function generateLegend(title: any, mapVals: any, colorScale: any, type: any) {

    // generate containing group if necessarry
    var container = d3.select("#legendID")

    if (container.empty()) { // if legend doesn't already exist
        container = d3.select('svg').append("g")
            .attr("id", "legendID")
    }


    // we need a unique list of values for the legend
    // as well as the count of those unique vals
    // they will sort alphabetically or descending if integer
    var counts = d3.map() as any; // {legend Row: counts}
    mapVals.values().forEach(function(d: any) {
        if (d != '') { // ignore empty data
            var count = 1
            if (counts.has(d)) {
                count = counts.get(d) + count;
            }
            counts.set(d,count);
        }
    });



    if (container.select("#legendID g").empty()) {
        var transform = 'translate(5,0)';
    } else {
        var offset = 15 + (d3.select('#legendID').node() as SVGSVGElement).getBBox().height;
        var transform = 'translate(5,' + offset + ')';
    }
    var legend = container.append("g")
            .attr("transform",transform)
            .attr("id", type == "circle" ? "node_legend" : "background_legend")

    // if legend is to show an ordinal range, we represent it as a colorbar
    // this way we don't have a potentially gigantic legend
    // the length 11 is set by the colorbrewer scale
    var sorted = autoSort(counts.keys());   
    var bar = false;

    let scale: any
    let labelScale: any

    // check if we have all numbers, ignore empty values
    if (parseInt(sorted[0])) {
        bar = true;
        scale = d3.scale.quantize().domain(range(0,10)).range(colorScale.range()); // mapping from metadata value to color
        labelScale = d3.scale.ordinal().domain(range(0,10)).rangePoints(d3.extent(sorted))
        sorted = range(0,10);
    } else {
        scale = colorScale;
    }

    legend.append("text")
        .style("font-weight","bold")
        .text(type == "circle" ? "Node: " : "Background: ")
        .attr("class","lead")
    legend.append("text")
        .attr("class","lead")
        .attr("x",type == "circle" ? 70 : 140)
        .text(title);


    var legendRow = legend.selectAll('g.legend')
        .data(sorted).enter()
        .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d: any,i: any) { return 'translate(11,' + (25 + i * 20) + ')'; } )
    
    if (type == 'circle' && bar === false) {
        legendRow.append(type)
            .attr('r', 4.5)
            .attr('fill', function(d: any) { return dimColor(colorScale(d)) } as any ) 
            .attr('stroke', function(d: any) { return colorScale(d) } ) 
            .attr("stroke-width",2);
    } else if (type == 'rect' || bar === true) {
        legendRow.append('rect')
            .attr('width', bar ? 45 : 9)
            .attr('height', bar ? 20 : 9)
            .attr('x', bar ? -4.5 : -4.5)
            .attr('y', bar ? -11 : -4.5)
            .attr('fill', function(d: any) {  return scale(d) } )
    }
        
    legendRow.append('text')
            .attr('dx', bar ? 0 : 8)
            .attr('dy', 3)
            .attr('text-anchor', 'start')
            .attr("fill", function(d: any) {
                if (bar) {
                    var L = d3.hsl(scale(d)).l;
                    var rgb = legendColorScale(L);
                    return d3.rgb(rgb,rgb,rgb);
                } else {
                    return 'black';
                }
            } as any)
            .text(function(d: any) { 
                if (bar) {
                    return labelScale(d).toFixed(2);
                } else {
                    return '(' + counts.get(d) + ') ' + d; 
                }
                return undefined
            } as any)
}



/* 

Will position the legend in the top/right corner
of window.

*/
function positionLegend() {
   
    var yPos = (margin.top + 30) / zoom.scale(); // 20 to make room for title
    var xPos = (d3.select("#legendID").node() as any).getBoundingClientRect().width;
    d3.select("#legendID").attr("transform","translate(" + (window.innerWidth - xPos - 15) + "," + yPos + ")");

}



/* helper function to generate array of length

Will generate an array of specified length,
starting at specified value.

Parameters:
===========
- start : int
    starting value for return array
- len : int
    length of desired return array

Returns:
========
- array
    order array with min value 0 and max value n

*/

function range(start: any, len: any) {

    var arr = [];

    for (var i = start; i < (len + start); i++) {
        arr.push(i);
    }
    return arr;
}


/* Ligten a color

Utility for generating a lighter version
of the given color

Parameters:
===========
- colorName : str
    html color name (http://html-color-codes.info/color-names/)

Returns:
========
- RGB of the input color that has been lightened by 20% (in HSL)


*/

function dimColor(colorName: any) {

    var c = d3.hsl(colorName);
    c.l += 0.20;
    c + "";
    return c;

}


// function called when user interacts with plot to pan and zoom with mouse
function panZoom() {
    // TODO
    d3.select('svg g').attr("transform", "translate(" + (d3.event.translate[0] + shiftX) + "," + (d3.event.translate[1] + shiftY) + ")" + " scale(" + d3.event.scale + ")")
}


/* 
After rotating the tree, some of the radials may be oriented improperly,
this function will go through all of them and rotate those labels that are
needed 180

*/
function orientTreeLabels() {
    var deg = 0;
    var rad = 0;

    d3.selectAll('.node text') 
        .attr("transform", function(d: any) { return addAngles(deg, d.x) > 180 && treeType == 'radial' ? "rotate(180)" : "" }) 
        .attr("text-anchor", function(d: any) { return addAngles(d.x, deg) > 180 && treeType == 'radial' ? "end" : "start" })
        .attr("dx", function(d: any) { 
            if (d.children) { // if inner node
                return treeType == 'radial' && addAngles(deg, d.x) > 180 ? 20 : -20;
            } else { // if leaf node
                return treeType == 'radial' && addAngles(deg, d.x) > 180 ? -(5 + rad) : (5 + rad);
            }
        }) 


}

// given two angles, will return the sum clamped to [0, 360]
function addAngles(a: any,b: any) {

    var sum = parseFloat(a) + parseFloat(b);

    if (sum > 360) {
        return sum - 360;
    } else if (sum < 0) {
        return sum + 360;
    } else {
        return sum;
    }
}


/* Set options global

Should be called everytime the tree needs to be updated due to
changes in the GUI

*/
function getGUIoptions() {

    // set tree type if GUI was updated
    // by anything other than tree type
    // buttons
    if (!('treeType' in options)) {
        options.treeType = treeType;
    }

    // somewhere in the code, global var 'options' is
    // being emptied ({}) so we are resetting the 
    // mapping info here


    if (typeof mappingFile != 'undefined') {
        options.mapping = mapParse;
        options.colorScale = colorScales;
    }

    if (options.treeType != treeType) {
        var typeChange = true;
    } else {
        var typeChange = false;
    }
    options.typeChange = typeChange;
    treeType = options.treeType; // update current tree type


    // get checkbox state
    options.skipDistanceLabel = false;
    options.skipLeafLabel = false;
    options.skipBranchLengthScaling = !jQuery('#scale_distance').is(':checked');

    // get slider vals

    options.sliderScaleV = 10; 
    options.sliderLeafR = 50;

    // get dropdown values
    var leafColor, backgroundColor;
    if ('mapping' in options && !options.mapping.empty()) {
        // TODO
        // var e = document.getElementById("leafColor");
        // options['leafColor'] = e.options[e.selectedIndex].value;
        // var e = document.getElementById("leafText");
        // options['leafText'] = e.options[e.selectedIndex].value;
        // var e = document.getElementById("backgroundColor");
        // options['backgroundColor'] = e.options[e.selectedIndex].value;
    }

}


/* Generate tree legend if needed
*/
function updateLegend() {

    // remove legend if one exists so we can update
    d3.selectAll("#legendID g").remove()

    // update leaf node
    if (options.leafColor != '') {
        var colorScale = options.colorScale.get(options.leafColor); // color scale
        var mapVals = options.mapping.get(options.leafColor); // d3.map() obj with leaf name as key

        // fill out legend
        generateLegend(options.leafColor, mapVals, colorScale, 'circle');

        // update node styling

        svg.selectAll('g.leaf.node circle')
            .transition()
            .style('fill', function(d: any) {
                return mapVals.get(d.name) ? dimColor(colorScale(mapVals.get(d.name))) : 'white'
            })
            .style('stroke', function(d: any) {
                return mapVals.get(d.name) ? colorScale(mapVals.get(d.name)) : 'gray'
            })

    } else if (options.leafColor == '') {
        svg.selectAll('g.leaf.node circle')
            .transition()
            .attr("style","");
    }

    // update leaf background
    if (options.backgroundColor != '') {
        var colorScale = colorScales.get(options.backgroundColor) // color scale
        var mapVals = mapParse.get(options.backgroundColor) // d3.map() obj with leaf name as key


        // fill out legend
        var offset = 25;
        generateLegend(options.backgroundColor, mapVals, colorScale, 'rect');

        // update node background style
        svg.selectAll('g.leaf.node rect')
            .transition()
            .duration(500)
            .attr("width", function(d: any) {
                var name = d.name.replace(new RegExp('\\.', 'g'), '_');
                var textWidth = d3.select('#leaf_' + name + ' text').node().getComputedTextLength();
                var radius = d3.select('#leaf_' + name + ' circle').node().getBBox().height / 2.0;
                return textWidth + radius + 10; // add extra so background is wider than label
            })
            .style('fill', function(d: any) {
                return mapVals.get(d.name) ? colorScale(mapVals.get(d.name)) : 'none'
            })
            .style('opacity',1)
    } else if (options.backgroundColor == '') {

        svg.selectAll('g.leaf.node rect')
            .transition()
            .duration(500)
            .attr('width','0')
            .style('opacity','1e-6')
    }

    if (options.backgroundColor != '' || options.leafColor != '') {
        positionLegend();
    }

     
    d3.select('svg').attr("viewBox", "0 0 " + parseInt(window.innerWidth as any) + " " + parseInt(window.innerHeight as any)); // set viewbox

}



/* initialize tree

Function called from front-end with all user-defined
opts to format the tree.  Will validate input
Newick tree, show a loading spinner, and then
render the tree

Parameters:
==========
- dat : string
		Newick tree as javascript var
- div : string
		div id (with included #) in which to generated tree
- options: obj
           options object with potential keys and values

options obj:
- mapping_file: path to OTU mapping file (if there is one)
- hideRuler: (bool) if true, background distance ruler is not rendered TODO
- skipBranchLengthScaling: (bool) if true, tree will not be scaled by distance TODO
- skipLabels: (bool) if true, leaves will not be labeled by name or distance
- treeType: either rectangular or radial

*/

export function renderTree(dat: any, div: any, options: any, geneData: any) {
    console.log(geneData)
    geneDataObj.geneData = geneData
    svg = undefined
    options = options;
    mapParse= undefined
    colorScales= undefined
    mappingFile= undefined
    margin = {top: 0, right: 10, bottom: 10, left: 10};
    startW = 1400, startH = 800;
    width = startW - margin.left - margin.right;
    height = startH - margin.top - margin.bottom;
    nodes= undefined
    links= undefined
    node= undefined
    link= undefined
    newick= undefined
    shiftX = 1;
    shiftY = 1;
    zoom = d3.behavior.zoom()
    treeType = 'rectangular'; // rectangular or circular [currently rendered treeType]
    scale = true; // if true, tree will be scaled by distance metric


    legendColorScale = d3.scale.linear().domain([0.5,1]).range([255,0])

    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0,20])
        .html(function(d: any) {
            return formatTooltip(d, options.mapping);
        })
    outerRadius = startW / 2,
        innerRadius = outerRadius - 170;

    // setup radial tree
    radialTree = d3.layout.cluster()
        .size([360, innerRadius])
        .children(function(d: any) { return d.branchset; })

    // setup rectangular tree
    rectTree = d3.layout.cluster()
        .children(function(node: any) {
            return node.branchset
        })
        .size([height, width]);

    duration = 1000;

    // process Newick tree
    newick = dat

    console.log(newick)

    // render tree
    buildTree(div, newick, options, function() { updateTree(options, geneDataObj.geneData); });


}


/* Primary tree building function

Will do an initial render of all SVG elements
including the GUI and the initial layout of
the tree.  Subsequent updating in both style
and format of the tree is done through updateTree()


Parameters:
===========
- div : string
        div id (with included #) in which to generated tree
- newick : Newick obj
           return of function processNewick()
- opts: obj
           opts object with potential keys and values


Retrurns:
=========
- nothing

*/

function buildTree(div: any, newick: any, opts: any, callback: any) {

    if ('mapping_dat' in opts) {
        var parsed = parseMapping(opts.mapping_dat);
        mapParse = parsed[0];
        colorScales = parsed[1];
        options.mapping = mapParse;
        options.colorScale = colorScales;
    }

    // check opts, if not set, set to default
    if (!('treeType' in opts)) {
        opts['treeType'] = treeType;
    } else {
        treeType = opts.treeType;
    }
    if (!('skipBranchLengthScaling' in opts)) {
        opts['skipBranchLengthScaling'] = !scale;
    } else {
        scale = opts.skipBranchLengthScaling;
    }

    // add bootstrap container class
    d3.select(div)
        .attr("class","container-fluid render")

    var tmp = d3.select(div).append("div")
            .attr("class","row")
            .attr("id","canvas")

    // NOTE: size of SVG and SVG g are updated in fitTree()
    svg = tmp.append("div")
            .attr("class", "col-sm-12")
            .attr("id","tree")
        .append("svg:svg")
            .attr("xmlns","http://www.w3.org/2000/svg")
            .attr("id","SVGtree")
            .call(zoom.on("zoom", panZoom))
        .append("g") // svg g group is translated by fitTree()
            .attr("id",'canvasSVG')
            .attr("transform","translate(" + margin.left + "," + margin.top + ")")

    svg.append("g")
            .attr("id","rulerSVG")
    svg.append("g")
            .attr("id","treeSVG")


    // generate intial layout and all tree elements
    d3.select("#canvasSVG")
    if (opts.treeType == 'rectangular') {
        layoutTree(rectTree, newick, opts);
    } else if (opts.treeType == 'radial') {
        layoutTree(radialTree, newick, opts);
    }

    svg.call(tip);
    callback(); // calls updateTree

}

/* will layout tree elements including nodes and links

Assumes globals (nodes, links) exist

Parameters:
-----------
- tree : d3.tree layout
- newick : Newick obj
           return of function processNewick()
- opts: obj
           opts object with potential keys and values

*/
function layoutTree(tree: any, newick: any, opts: any) {
    d3.selectAll("g.ruleGroup").remove() // remove ruler
    var yscale = null
    var xscale = null
    nodes = tree.nodes(newick);
    if (!opts.skipBranchLengthScaling) { yscale = scaleBranchLengths(nodes, width); }
    if (opts.treeType == 'rectangular') { xscale = scaleLeafSeparation(tree, nodes); }
    links = tree.links(nodes);


    formatTree(nodes, links, yscale, xscale, height, opts);
}



/* Function used to update existing tree

Function called from front-end everytime GUI
is changed; this will redraw the tree based
on GUI settings.

*/
function updateTree(options: any, geneData: any) {


    getGUIoptions(); // set our globals


    // adjust physical positioning
    if (options.typeChange || options.skipBranchLengthScaling != scale) {

        layoutTree( options.treeType == 'rectangular' ? rectTree : radialTree, newick, options);

        // reset rotation to 0 (rect) or to previous pos (radial)
        d3.select('#treeSVG').attr('transform', function(d: any) {
            if (options.treeType == 'rectangular') {
                return 'rotate(0)';
            } else {
                return 'rotate(0)';
            }
        })

        scale = options.skipBranchLengthScaling;
    }

    // adjust vertical scale
    if (options.treeType == 'rectangular') {
        var xscale = scaleLeafSeparation(rectTree, nodes, options.sliderScaleV); // this will update x-pos

        // update ruler length
        var treeH = getTreeBox().height + 32; // +32 extends rulers outside treeSVG
        d3.selectAll(".ruleGroup line")
            .attr("y2", treeH + margin.top + margin.bottom) // TOD1O doesn't work quite right with large scale

        // scale vertical pos
        svg.selectAll("g.node")
            .data(nodes)
            .attr("transform", function(d: any) { return "translate(" + d.y + "," + d.x + ")"; });
        svg.selectAll("path.link")
            .data(links)
            .attr("d", elbow);
    }


    svg.selectAll("g.leaf circle")
        .attr("r", options.sliderLeafR);
    orientTreeLabels();


    // toggle leaf labels
    svg.selectAll('g.leaf.node text')
        .style('fill-opacity', options.skipLeafLabel? 1e-6 : 1 )

    // toggle distance labels
    svg.selectAll('g.inner.node text')
        .style('fill-opacity', options.skipDistanceLabel? 1e-6 : 1 )

    svg.selectAll('g.leaf.node text')
        .text(function(d: any) {
            return geneData && geneData[d.name] && geneData[d.name].GENE_NAME;
        });


    if ('mapping' in options) {
        updateLegend();  // will reposition legend as well
    } else {
        d3.select('svg').attr("viewBox", "0 0 " + parseInt(window.innerWidth as any) + " " + parseInt(window.innerHeight as any)); // set viewbox
    }

}



