import * as D3 from "d3";
import { step } from "./utils/step";
import { autoSort } from "./utils/autoSort";
import { scaleBranchLengths } from "./utils/scale-branch-lengths";
import { elbow } from "./utils/elbow";
import { addAngles } from "./utils/addAngles";
import { formatTooltip } from "./utils/formatTooltip";
import { range } from "./utils/range";
import { getTreeBox } from "./utils/getTreeBox";
import { scaleLeafSeparation } from "./utils/scaleLeafSeparation";
import { dimColor } from "./utils/dimColor";
import { positionLegend } from "./utils/positionLegend";
import { panZoom } from "./utils/panZoom";


declare var d3: {
    behavior: typeof  D3.behavior,
    layout: typeof  D3.layout, 
    selectAll: typeof  D3.selectAll, 
    select: any, 
    tip: any,
    scale: typeof D3.scale,
    map: typeof D3.map,
    min: typeof D3.min,
    hsl: typeof D3.hsl,
    rgb: typeof D3.rgb,
    extent: typeof D3.extent,
    set: typeof D3.set,
    event: any//typeof D3.event,
}
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
var shiftX = 0;
var shiftY = 0;
var zoom = d3.behavior.zoom()

// tree defaults
var scale = true; // if true, tree will be scaled by distance metric

// scale for adjusting legend
// text color based on background
// [background HSL -> L value]
// domain is L (0,1)
// range is RBG
var legendColorScale = d3.scale.linear().domain([0.5,1]).range([255,0])

// tooltip


var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0,20])
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

const treeGlobalObject = {
    links, 
    geneData: {}

}



export class TreeRenderer {
    svg: any
    options = {} as any
    mapParse: any
    colorScales: any
    mappingFile: any
    margin = {top: 0, right: 10, bottom: 10, left: 10};
    startW = 800
    startH = 600
    width = this.startW - this.margin.left - this.margin.right;
    height = this.startH - this.margin.top - this.margin.bottom;
    nodes: any
    links: any
    node: any
    link: any
    newick: any
    shiftX = 0;
    shiftY = 0;
    zoom = d3.behavior.zoom()
    treeType = 'rectangular'
    scale = true
    legendColorScale = d3.scale.linear().domain([0.5,1]).range([255,0])
    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0,20])
    outerRadius = this.startW / 2
    innerRadius = this.outerRadius - 170;
    radialTree = d3.layout.cluster()
        .size([360, this.innerRadius])
        .children(function(d: any) { return d.branchset; })
    rectTree = d3.layout.cluster()
        .children(function(node: any) {
            return node.branchset
        })
        .size([this.height, this.width]);
    duration = 1000;
    treeGlobalObject = {
        links, 
        geneData: {}
    }

    constructor() {}

    renderTree(dat: any, div: any, options: any, geneData: any) {
        this.treeGlobalObject.geneData = geneData
        this.options = options;
        this.shiftX = 1;
        this.shiftY = 1;
    
        // setup radial tree
        this.radialTree = d3.layout.cluster()
            .size([360, innerRadius])
            .children(function(d: any) { return d.branchset; })
    
        // setup rectangular tree
        this.rectTree = d3.layout.cluster()
            .children(function(node: any) {
                return node.branchset
            })
            .size([this.height, this.width]);
    

        this.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0,20])
        .html(function(d: any) {
            return formatTooltip(d, geneData);
        })
    
        // process Newick tree
        this.newick = dat
    
        // render tree
        this.buildTree(div, this.newick, options, () => this.updateTree(options, geneData));
    }

    buildTree(div: any, newick: any, opts: any, callback: any) {

        // check opts, if not set, set to default
        if (!('treeType' in opts)) {
            opts['treeType'] = this.treeType;
        } else {
            this.treeType = opts.treeType;
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
                .call(zoom.on("zoom", () => panZoom(shiftX, shiftY)))
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
            this.layoutTree(rectTree, newick, opts);
        } else if (opts.treeType == 'radial') {
            this.layoutTree(radialTree, newick, opts);
        }
    
        svg.call(tip);
        callback(); // calls updateTree
    
    }

    updateTree(options: any, geneData: any) {

        this.getGUIoptions(); // set our globals
    
    
        // adjust physical positioning
        if (options.typeChange || options.skipBranchLengthScaling != scale) {
    
            this.layoutTree( options.treeType == 'rectangular' ? rectTree : radialTree, this.newick, options);
    
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
            var xscale = scaleLeafSeparation(treeGlobalObject, rectTree, nodes, options.sliderScaleV); // this will update x-pos
    
            // update ruler length
            var treeH = getTreeBox(this.treeType, nodes).height + 32; // +32 extends rulers outside treeSVG
            d3.selectAll(".ruleGroup line")
                .attr("y2", treeH + margin.top + margin.bottom) // TOD1O doesn't work quite right with large scale
    
            // scale vertical pos
            svg.selectAll("g.node")
                .data(nodes)
                .attr("transform", function(d: any) { return "translate(" + d.y + "," + d.x + ")"; });
            svg.selectAll("path.link")
                .data(treeGlobalObject.links)
                .attr("d", elbow);
        }
    
    
        svg.selectAll("g.leaf circle")
            .attr("r", options.sliderLeafR);
        this.orientTreeLabels();
    
    
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
            this.updateLegend();  // will reposition legend as well
        } else {
            d3.select('svg').attr("viewBox", "0 0 " + parseInt(window.innerWidth as any) + " " + parseInt(window.innerHeight as any)); // set viewbox
        }
    
    }
    
    layoutTree(tree: any, newick: any, opts: any) {
        d3.selectAll("g.ruleGroup").remove() // remove ruler
        var yscale = null
        var xscale = null
        nodes = tree.nodes(this.newick);
        if (!opts.skipBranchLengthScaling) { yscale = scaleBranchLengths(nodes, width); }
        if (opts.treeType == 'rectangular') { xscale = scaleLeafSeparation(treeGlobalObject, tree, nodes); }
        treeGlobalObject.links = tree.links(nodes);
    
    
        this.formatTree(nodes, treeGlobalObject.links, yscale, xscale, height, opts);
    }

    formatTree(nodes: any, links: any, yscale: any=null, xscale: any=null, height: any, opts: any) {

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
          .data(treeGlobalObject.links)
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
    
        this.orientTreeLabels(); 
    
    
    
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
                        .attr('y2', getTreeBox(this.treeType, nodes).height + margin.top + margin.bottom)
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

    updateLegend() {

        // remove legend if one exists so we can update
        d3.selectAll("#legendID g").remove()
    
        // update leaf node
        if (options.leafColor != '') {
            var colorScale = options.colorScale.get(options.leafColor); // color scale
            var mapVals = options.mapping.get(options.leafColor); // d3.map() obj with leaf name as key
    
            // fill out legend
            this.generateLegend(options.leafColor, mapVals, colorScale, 'circle');
    
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
            this.generateLegend(options.backgroundColor, mapVals, colorScale, 'rect');
    
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
            positionLegend(margin, zoom);
        }
    
         
        d3.select('svg').attr("viewBox", "0 0 " + parseInt(window.innerWidth as any) + " " + parseInt(window.innerHeight as any)); // set viewbox
    
    }
    
    getGUIoptions() {

        // set tree type if GUI was updated
        // by anything other than tree type
        // buttons
        if (!('treeType' in options)) {
            options.treeType = this.treeType;
        }
    
        // somewhere in the code, global var 'options' is
        // being emptied ({}) so we are resetting the 
        // mapping info here
    
    
        if (typeof mappingFile != 'undefined') {
            options.mapping = mapParse;
            options.colorScale = colorScales;
        }
    
        if (options.treeType != this.treeType) {
            var typeChange = true;
        } else {
            var typeChange = false;
        }
        options.typeChange = typeChange;
        this.treeType = options.treeType; // update current tree type
    
    
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

    orientTreeLabels() {
        var deg = 0;
        var rad = 0;
    
        d3.selectAll('.node text') 
            .attr("transform", (d: any) => { return addAngles(deg, d.x) > 180 && this.treeType == 'radial' ? "rotate(180)" : "" }) 
            .attr("text-anchor", (d: any) => { return addAngles(d.x, deg) > 180 && this.treeType == 'radial' ? "end" : "start" })
            .attr("dx", (d: any) => { 
                if (d.children) { // if inner node
                    return this.treeType == 'radial' && addAngles(deg, d.x) > 180 ? 20 : -20;
                } else { // if leaf node
                    return this.treeType == 'radial' && addAngles(deg, d.x) > 180 ? -(5 + rad) : (5 + rad);
                }
            }) 
    
    
    }

    generateLegend(title: any, mapVals: any, colorScale: any, type: any) {

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

}