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

import empty from './tree-data/empty.json';

import allAAData from './tree-data/all_aa.json';
import allDataXlsx from './tree-data/all_xlsx.json';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';

const dataMap = {
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
  modifiedTreeDataObject!:any;

  treeType = 'radial'

  hideLabels = true;

  
  treeRenderer = new TreeRenderer()

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {

    this.modifiedTreeDataObject = JSON.parse(JSON.stringify(this.treeDataObject))
  
    this.rerender(this.treeDataObject, this.geneData)
    console.log(this.treeDataObject)

    function searchTree(element: any, matchingTitle: any): any{
      if(element.name == matchingTitle){
           return element;
      }else if (element.branchset.length){
           var i;
           var result = null;
           for(i=0; result == null && i < element.branchset.length; i++){
                result = searchTree(element.branchset[i], matchingTitle);
           }
           return result;
      }
      return null;
    }

    this.treeRenderer.event$.subscribe((e: any) => {
      const node = searchTree(this.modifiedTreeDataObject, e && e.name)

      if(node) {
        const [a, b] = node.branchset
        node.branchset = [b, a]
        
        this.rerender(JSON.parse(JSON.stringify(this.modifiedTreeDataObject)), this.geneData)
      
      }
    }
    )
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
    this.treeRenderer.selectLeafs(e, 'green')
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


      // this.modifiedTreeDataObject = JSON.parse(JSON.stringify(this.treeDataObject))
      this.rerender(this.treeDataObject, this.geneData)
    }
  }

  changeSeqType(e: any) {
    if(e.value !== this.seqType) {
      this.seqType = e.value
      this.treeDataObject = dataMap[this.dataType][this.seqType].treeData
      this.geneData =  dataMap[this.dataType][this.seqType].description

      // this.modifiedTreeDataObject = JSON.parse(JSON.stringify(this.treeDataObject))
      this.rerender(this.treeDataObject, this.geneData)
    }
  }

  download() {
    var svgData = document.getElementById("SVGtree")!.outerHTML;
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "newesttree.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
