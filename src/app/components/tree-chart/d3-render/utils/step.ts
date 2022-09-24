
// https://bl.ocks.org/mbostock/c034d66572fd6bd6815a
// Like d3.svg.diagonal.radial, but with square corners.
export function step(startAngle: any, startRadius: any, endAngle: any, endRadius: any) {
    var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
        s0 = Math.sin(startAngle),
        c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
        s1 = Math.sin(endAngle);
    return "M" + startRadius * c0 + "," + startRadius * s0
        + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
        + "L" + endRadius * c1 + "," + endRadius * s1;
  }
  
  