
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

export function range(start: any, len: any) {

    var arr = [];

    for (var i = start; i < (len + start); i++) {
        arr.push(i);
    }
    return arr;
}
