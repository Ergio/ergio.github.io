
// given two angles, will return the sum clamped to [0, 360]
export function addAngles(a: any,b: any) {

    var sum = parseFloat(a) + parseFloat(b);

    if (sum > 360) {
        return sum - 360;
    } else if (sum < 0) {
        return sum + 360;
    } else {
        return sum;
    }
}
