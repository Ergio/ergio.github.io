
export const fetchDataMap = {
    abc: {
        nucleotides: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/abc.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/abc_xlsx.json',
        },
        amino_acids: {
            treeData: null,
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/abc_xlsx.json',
        }
    },
    mfs: {
        nucleotides: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/mfs.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/mfs_xlsx.json',
        },
        amino_acids: {
            treeData: null,
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/mfs_xlsx.json',
        }
    },
    all: {
        nucleotides: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/all.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/all_xlsx.json',
        },
        amino_acids: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/all_aa.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/all_xlsx.json',
        }
    },
    transmembrane: {
        nucleotides: {
            treeData: null,
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/transmembrane_desc.json',
        },
        amino_acids: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/transmembrane_aa.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/transmembrane_desc.json',
        }
    },
    notTransmembrane: {
        nucleotides: {
            treeData: null,
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/not_transmembrane_desc.json',
        },
        amino_acids: {
            treeData: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/not_transmembrane_aa.json',
            description: 'https://storage.googleapis.com/bu_genomy_1/genomy-data/not_transmembrane_desc.json',
        }
    }
}