export function convert_to_newick(tree: any, base_len: number){
    let cladesText
    let processed_cladesText = ''

    let sum = (tree.branch_length || 0)

    if (tree.clades.clades) {
        cladesText = tree.clades.clades.map((v: any) => {
            return convert_to_newick(v,  sum)
        }).join(',')
        if (cladesText) {
            processed_cladesText = '(' + cladesText + '):' + tree.branch_length
        }
    }

    if (tree.name && !(tree.name.indexOf('Inner') < 0)) {
        return processed_cladesText
    }

    return  tree.name + ':' + (sum) + processed_cladesText 
}