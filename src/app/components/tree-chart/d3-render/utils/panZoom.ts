declare var d3: any;
// function called when user interacts with plot to pan and zoom with mouse
export function panZoom(shiftX: number, shiftY: number) {
    // TODO
    d3.select('svg g').attr("transform", "translate(" + (d3.event.translate[0] + shiftX) + "," + (d3.event.translate[1] + shiftY) + ")" + " scale(" + d3.event.scale + ")")
}
