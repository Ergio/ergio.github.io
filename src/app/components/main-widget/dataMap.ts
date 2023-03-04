import mfsData from './tree-data/mfs.json';
import mfsDataXlsx from './tree-data/mfs_xlsx.json';

import abcData from './tree-data/abc.json';
import abcDataXlsx from './tree-data/abc_xlsx.json';

import allData from './tree-data/all.json';

import empty from './tree-data/empty.json';

import allAAData from './tree-data/all_aa.json';
import allDataXlsx from './tree-data/all_xlsx.json';

export const dataMap = {
    abc: {
        nucleotides: {
            treeData: abcData as any,
            description: abcDataXlsx as any,
        },
        amino_acids: {
            treeData: empty as any,
            description: abcDataXlsx as any,
        }
    },
    mfs: {
        nucleotides: {
            treeData: mfsData as any,
            description: mfsDataXlsx as any,
        },
        amino_acids: {
            treeData: empty as any,
            description: mfsDataXlsx as any,
        }
    },
    all: {
        nucleotides: {
            treeData: allData as any,
            description: allDataXlsx as any,
        },
        amino_acids: {
            treeData: allAAData as any,
            description: allDataXlsx as any,
        }
    }
}