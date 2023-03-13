// @ts-nocheck

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
import { panZoom } from "./utils/panZoom";
import { BehaviorSubject } from "rxjs";



const globalConfig = {
    startW: 1000,
    startH: 1000,
    selectLeafsR: 10,
}


declare var d3: {
    behavior: typeof D3.behavior,
    layout: typeof D3.layout,
    selectAll: typeof D3.selectAll,
    select: any,
    tip: any,
    scale: typeof D3.scale,
    map: typeof D3.map,
    min: typeof D3.min,
    hsl: typeof D3.hsl,
    rgb: typeof D3.rgb,
    extent: typeof D3.extent,
    set: typeof D3.set,
    event: any
}

declare var jQuery: any




export class TreeRenderer {
    svg: any
    options = {} as any
    mapParse: any
    colorScales: any
    mappingFile: any
    margin = { top: 0, right: 10, bottom: 10, left: 10 };
    startW = globalConfig.startW
    startH = globalConfig.startH
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
    highlightedLeaf = undefined;
    scale = true
    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 20])
    outerRadius = this.startW / 2
    innerRadius = this.outerRadius - 170;
    radialTree = d3.layout.cluster()
        .size([360, this.innerRadius])
        .children(function (d: any) { return d.branchset; })
    rectTree = d3.layout.cluster()
        .children(function (node: any) {
            return node.branchset
        })
        .size([this.height, this.width]);
    duration = 1000;
    treeGlobalObject = {
        links: undefined,
        geneData: {}
    }

    event$ = new BehaviorSubject(null)
    events$: BehaviorSubject<any> = new BehaviorSubject<any>(null)

    constructor() { }

    renderTree(dat: any, div: any, options: any, geneData: any) {
        this.treeGlobalObject.geneData = geneData
        this.options = options;

        // setup radial tree
        this.radialTree = d3.layout.cluster()
            .size([360, this.innerRadius])
            .children(function (d: any) { return d.branchset; })

        // setup rectangular tree
        this.rectTree = d3.layout.cluster()
            .children(function (node: any) {
                return node.branchset
            })
            .size([this.height, this.width]);


        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([0, 20])
            .html(function (d: any) {
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
            opts['skipBranchLengthScaling'] = !this.scale;
        } else {
            this.scale = opts.skipBranchLengthScaling;
        }

        d3.select(div).selectAll("*").remove();

        // add bootstrap container class
        d3.select(div)
            .attr("class", "container-fluid render")

        var tmp = d3.select(div).append("div")
            .attr("class", "row")
            .attr("id", "canvas")

        // NOTE: size of SVG and SVG g are updated in fitTree()
        this.svg = tmp.append("div")
            .attr("class", "col-sm-12")
            .style('height', tmp[0][0].offsetHeight + 'px')
            .style('background-color', 'white')
            .attr("id", "tree")
            .append("svg:svg")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("id", "SVGtree")
            .style('height', '100%')
            .style('width', '100%')
            .call(this.zoom.on("zoom", () => panZoom(this.shiftX, this.shiftY)))
            .append("g") // svg g group is translated by fitTree()
            .attr("id", 'canvasSVG')
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

        this.svg.append("g")
            .attr("id", "pieSVG")
        this.svg.append("g")
            .attr("id", "rulerSVG")

        this.svg.append("g")
            .attr("id", "treeSVG")


        // generate intial layout and all tree elements
        d3.select("#canvasSVG")
        if (opts.treeType == 'rectangular') {
            this.layoutTree(this.rectTree, newick, opts);
        } else if (opts.treeType == 'radial') {
            this.layoutTree(this.radialTree, newick, opts);
        }

        this.svg.call(this.tip);
        callback(); // calls updateTree

    }

    updateTree(options: any, geneData: any) {

        this.getGUIoptions(); // set our globals


        // adjust physical positioning
        if (options.typeChange || options.skipBranchLengthScaling != this.scale) {

            this.layoutTree(options.treeType == 'rectangular' ? this.rectTree : this.radialTree, this.newick, options);

            // reset rotation to 0 (rect) or to previous pos (radial)
            d3.select('#treeSVG').attr('transform', function (d: any) {
                if (options.treeType == 'rectangular') {
                    return 'rotate(0)';
                } else {
                    return 'rotate(0)';
                }
            })

            this.scale = options.skipBranchLengthScaling;
        }

        // adjust vertical scale
        if (options.treeType == 'rectangular') {
            var xscale = scaleLeafSeparation(this.treeGlobalObject, this.rectTree, this.nodes, options.sliderScaleV); // this will update x-pos

            // update ruler length
            var treeH = getTreeBox(this.treeType, this.nodes).height + 32; // +32 extends rulers outside treeSVG
            d3.selectAll(".ruleGroup line")
                .attr("y2", treeH + this.margin.top + this.margin.bottom) // TOD1O doesn't work quite right with large scale

            // scale vertical pos
            this.svg.selectAll("g.node")
                .data(this.nodes)
                .attr("transform", function (d: any) { return "translate(" + d.y + "," + d.x + ")"; });
            this.svg.selectAll("path.link")
                .data(this.treeGlobalObject.links)
                .attr("d", elbow);
        }


        this.svg.selectAll("g.leaf circle.main")
            .attr("r", options.sliderLeafR)
            .style('fill', '#aaa')

        this.orientTreeLabels();

        d3.select('svg').attr("viewBox", "0 0 " + parseInt(window.innerWidth as any) + " " + parseInt(window.innerHeight as any)); // set viewbox

    }

    layoutTree(tree: any, newick: any, opts: any) {
        d3.selectAll("g.ruleGroup").remove() // remove ruler
        var yscale = null
        var xscale = null
        this.nodes = tree.nodes(this.newick);
        if (!opts.skipBranchLengthScaling) { yscale = scaleBranchLengths(this.nodes, this.width); }
        if (opts.treeType == 'rectangular') { xscale = scaleLeafSeparation(this.treeGlobalObject, tree, this.nodes); }
        this.treeGlobalObject.links = tree.links(this.nodes);


        this.formatTree(this.nodes, this.treeGlobalObject.links, yscale, xscale, this.height, opts);
    }

    formatTree(nodes: any, links: any, yscale: any = null, xscale: any = null, height: any, opts: any) {
        this.link = d3.select('#treeSVG').selectAll("path.link")
            .data(this.treeGlobalObject.links)
            .enter().append("path")
            .attr("class", "link")
            .style("fill", "none") // setting style inline otherwise AI doesn't render properly
            .style("stroke", "#aaa")
            .style("stroke-width", "2px")

        d3.selectAll('.link')
            .attr("d", function (d: any) { return opts.tree == 'rectangular' ? elbow(d) : step(d.source.x, d.source.y, d.target.x, d.target.y); })


        if (!('sliderLeafR' in opts)) {
            opts['sliderLeafR'] = 5;
        }

        this.node = d3.select('#treeSVG').selectAll("g.node")
            .data(nodes)
            .enter().append("g")
            .attr("class", function (n: any) {
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
            .attr("id", function (d: any) {
                if (!d.children) {
                    var name = d.name.replace(new RegExp('\\.', 'g'), '_');
                    return 'leaf_' + name;
                }
                return undefined
            } as any)

        d3.selectAll('.node')
            .attr("transform", function (d: any) {
                if (opts.treeType == 'rectangular') {
                    return "translate(" + d.y + "," + d.x + ")";
                } else if (opts.treeType == 'radial') {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                }
                return undefined
            } as any)


        // node backgrounds
        this.node.append("rect")
            .attr('width', 0) // width is set when choosing background color
            .attr('height', 10 + opts.sliderLeafR * 2)
            .attr('y', -opts.sliderLeafR - 5)
            .attr("opacity", function (d: any) { return d.children ? 1e-6 : 1 });

        // node circles
        this.node.append("circle")
            .attr("class", "helper")
            .attr("r", 5)
            .attr("opacity", 0);

        this.node.append("circle")
            .attr("r", function (d: any) {
                if (!d.children || d.depth == 0) {
                    return opts.sliderLeafR;
                } else {
                    return 3;
                }
            })
            .attr("class", "main")




        // node label
        this.node.append("text")
            .attr("class", function (d: any) { return d.children ? "distanceLabel" : "leafLabel" })
            .attr("dy", function (d: any) { return d.children ? -6 : 3 })




        d3.selectAll('.leaf')
            .style('cursor', 'pointer')
            .on('click', (d) => {
                this.events$.next({
                    type: 'clickOnLeaf',
                    data: d,
                })
                this.highlightedLeaf = d.name
                this.svg.selectAll("g.leaf circle.helper")
                    .attr("r", (d: any) => {
                        if (d.name === this.highlightedLeaf) {
                            return 8
                        }
                        return 3
                    })
                    .attr("opacity", (d: any) => {
                        if (d.name === this.highlightedLeaf) {
                            return 0.7
                        }
                        return 0
                    })
                    .style('fill', (d: any) => {
                        if (d.name === this.highlightedLeaf) {
                            return "#77C66E"
                        }
                        return "#aaa"
                    })
            })

        d3.selectAll('g.inner')
            .style('cursor', 'pointer')
            .on('click', (d) => {
                this.events$.next({
                    type: 'rotateNode',
                    data: d,
                })
            })

        this.orientTreeLabels();



        if (!opts.hideRuler && yscale != null) {

            if (opts.treeType == 'rectangular') {
                d3.select('#rulerSVG').attr("fill", "white")


                let rulerG = d3.select('#rulerSVG').selectAll("g")
                    .data(yscale.ticks(10))
                    .enter().append("g")
                    .attr("class", "ruleGroup")
                    .append('svg:line')
                    .attr("class", "rule")
                    .attr('y1', 0)
                    .attr('y2', getTreeBox(this.treeType, nodes).height + this.margin.top + this.margin.bottom)
                    .attr('x1', yscale)
                    .attr('x2', yscale)



            } else if (opts.treeType == 'radial') {

                d3.select('#rulerSVG').attr("fill", "white")

                let rulerG = d3.select('#rulerSVG').selectAll("g")
                    .data(yscale.ticks(10))
                    .enter().append("g")
                    .attr("class", "ruleGroup")
                    .append('circle')
                    .attr("class", "rule")
                    .attr('r', yscale);

            }
        }
    }


    getGUIoptions() {
        const options = this.options
        // set tree type if GUI was updated
        // by anything other than tree type
        // buttons
        if (!('treeType' in options)) {
            options.treeType = this.treeType;
        }

        // somewhere in the code, global var 'options' is
        // being emptied ({}) so we are resetting the 
        // mapping info here


        if (typeof this.mappingFile != 'undefined') {
            options.mapping = this.mapParse;
            options.colorScale = this.colorScales;
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
        options.sliderLeafR = 3;

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
                    return this.treeType == 'radial' && addAngles(deg, d.x) > 180 ? -(10 + rad) : (10 + rad);
                }
            })


    }

    selectLeafs(geneMap: any, color = "red") {
        this.svg.selectAll("g.leaf circle.main")
            .attr("r", function (d: any) {
                return geneMap[d.name] ? globalConfig.selectLeafsR : 3
            })
            // .attr("opacity", "0.2")
            .style('fill', function (d: any) {
                return geneMap[d.name] ? geneMap[d.name] : "#aaa"
            })
    }


    selectPieSections(geneMap: any, color = "red") {


        d3.select('#pieSVG').selectAll("*").remove();

        if (this.treeType == 'radial') {
            this.pie(geneMap)

        }
    }

    hideLabels(isHidden: boolean) {
        const geneData = this.treeGlobalObject.geneData as any
        this.svg.selectAll('g.leaf.node text')
            .text(isHidden ? '' : function (d: any) {
                return geneData && geneData[d.name] && geneData[d.name].GENE_NAME;
            });
    }






























    pie(geneMap: any) {


        var r = 2000; // outer radius 


        var data = this.nodes && this.nodes.filter(node => node.branchset && node.branchset.length === 0).map((val, index) => ({
            value: 1,
            color: geneMap[val.name] ? geneMap[val.name] : '#fff',
            name: val.name,
        }))


        var group = d3.select('#pieSVG')
            .attr("opacity", '0.2')


        var arc = d3.svg.arc()
            .innerRadius(0)
            .outerRadius(r);

        var pie = d3.layout.pie()
            .value(function (d) { return d.value; }); // pie function transform data into specific format

        var arcs = group.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("class", "background-arc")
            .attr("d", arc) // here the arc function works on every record d of data 
            .attr("fill", function (d) {
                return (d.data && d.data.color);
            });
    }
}





