import { AfterViewInit, Component, ChangeDetectorRef, Input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LegendWidgetComponent } from '../legend-widget/legend-widget.component';
import { CommonModule } from '@angular/common';
import { TreeRenderer } from './d3-render/tree-render';
import { FormsModule } from '@angular/forms';

import mfsData from './tree-data/mfs.json';
import mfsDataXlsx from './tree-data/mfs_xlsx.json';

import abcData from './tree-data/abc.json';
import abcDataXlsx from './tree-data/abc_xlsx.json';

import allData from './tree-data/all.json';

import allAAData from './tree-data/all_aa.json';
import allDataXlsx from './tree-data/all_xlsx.json';

const dataMap = {
  abc: {
    nucleotides: {
      treeData: abcData as any,
      description: abcDataXlsx as any,
    },
    amino_acids: {
      treeData: {} as any,
      description: abcDataXlsx as any,
    }
  },
  mfs: {
      nucleotides: {
        treeData: mfsData as any,
        description: mfsDataXlsx as any,
      },
      amino_acids: {
        treeData: {} as any,
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

@Component({
  selector: 'app-tree-chart',
  templateUrl: './tree-chart.component.html',
  styleUrls: ['./tree-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
    LegendWidgetComponent,
    FormsModule

  ]
})
export class TreeChartComponent implements AfterViewInit {
  // treeDataObject = abcData
  // geneData = abcDataXlsx

  @Input() data!: any
  @Input() dataXlsx!: any

  dataType: 'abc' | 'mfs' | 'all' = 'abc'

  seqType: 'nucleotides' | 'amino_acids' = 'nucleotides'

  treeDataObject:any = dataMap[this.dataType][this.seqType].treeData
  geneData:any =  dataMap[this.dataType][this.seqType].description

  treeType = 'radial'

  hideLabels = true;
  treeRenderer = new TreeRenderer()

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {

  
    this.rerender(this.treeDataObject, this.geneData)
  }

  rerender(treeData: any, geneData: any) {
    this.treeRenderer.renderTree(treeData, '#tree-chart', { treeType: this.treeType }, geneData)
  }

  changeTreeType(e: any) {
    if (this.treeType !== e.value) {
      this.treeType = e.value
      this.treeRenderer = new TreeRenderer()
      this.geneData = {...this.geneData}
      this.rerender(this.treeDataObject, this.geneData)
    }
  }

  onSelectOptions(e: any) {
    this.treeRenderer.selectLeafs(e)
  }

  onHideLabels() {
    this.treeRenderer.hideLabels(this.hideLabels)
  }

  changeData(e: any) {
    if(e.value !== this.dataType) {
      this.dataType = e.value
      console.log(this.dataType)
      console.log(dataMap[this.dataType])
      this.treeDataObject = dataMap[this.dataType][this.seqType].treeData
      this.geneData =  dataMap[this.dataType][this.seqType].description

      this.rerender(this.treeDataObject, this.geneData)
    }
  }

  changeSeqType(e: any) {
    if(e.value !== this.seqType) {
      this.seqType = e.value
      this.treeDataObject = dataMap[this.dataType][this.seqType].treeData
      this.geneData =  dataMap[this.dataType][this.seqType].description

      this.rerender(this.treeDataObject, this.geneData)
    }
  }
}
