
declare var d3: any;
/* 

Will position the legend in the top/right corner
of window.

*/
export function positionLegend(margin: any, zoom: any) {
   
    var yPos = (margin.top + 30) / zoom.scale(); // 20 to make room for title
    var xPos = (d3.select("#legendID").node() as any).getBoundingClientRect().width;
    d3.select("#legendID").attr("transform","translate(" + (window.innerWidth - xPos - 15) + "," + yPos + ")");

}