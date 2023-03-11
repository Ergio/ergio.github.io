export function formatTooltip(d: any, geneData: any) {


    var html = ""

    Object.entries(geneData[d.name]).slice(0, 7).forEach(function ([col, value]) {
        html += '<p class="tip-row"><span style="font-weight: 700;" class="tip-meta-title"> ' + col + '</span>: <span class="tip-meta-name">' + value + '</span><p>';
    })
    return html;
}