declare var d3: any

export function getTreeBox(treeType: string, nodes: any) {

    if (treeType == 'rectangular') {
        var tmp_height = d3.extent(nodes.map(function(d: any) { return d.x }));
        var tmp_width = d3.extent(nodes.map(function(d: any) { return d.y })); // note width will be off since it doesn't take into account the label text
        return {'height':tmp_height[1] - tmp_height[0], 'width':tmp_width[1] - tmp_width[0] };
    } else {

        return (d3.select('#treeSVG').node() as any).getBoundingClientRect();
    }


}
