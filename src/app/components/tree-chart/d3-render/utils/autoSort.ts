declare var d3: any;

export function autoSort(arr: any, unique: any=false) {

    // get unique values of array
    // by converting to d3.set()
    if (unique) { arr = d3.set(arr).values(); }

    var vals = arr.map(filterTSVval); // convert to int or float if needed
    var sorted = (typeof vals[0] === 'string' || vals[0] instanceof String) ? vals.sort() : vals.sort(function(a: any,b: any) { return a - b; }).reverse();

    return sorted;

}

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