// http://bl.ocks.org/mbostock/2429963
// draw right angle links to join nodes
export function elbow(d: any) {
    return "M" + d.source.y + "," + d.source.x
        + "V" + d.target.x + "H" + d.target.y;
  }
  
  