export function formatTooltip(d: any, geneData: any) {


    var html = ""

    const props = ["GENE_NAME", "CLUSTER", "ORGANISM", "CLUSTER_PRODUCT", "BIOSYNTHETIC_CLASSES", "GENE_PRODUCT", "PROTEIN_ID"]

    props.forEach(function(col: any) {
        html += '<p class="tip-row"><span style="font-weight: 700;" class="tip-meta-title"> ' + col + '</span>: <span class="tip-meta-name">' + geneData[d.name][col] + '</span><p>';
    })
    return html;
}