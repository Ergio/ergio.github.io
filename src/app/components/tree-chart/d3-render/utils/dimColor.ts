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

declare var d3: any;

export function dimColor(colorName: any) {

    var c = d3.hsl(colorName);
    c.l += 0.20;
    c + "";
    return c;

}