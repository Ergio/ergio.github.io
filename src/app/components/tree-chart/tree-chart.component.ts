import { AfterViewInit, Component, ChangeDetectorRef } from '@angular/core';
import { jsonData1 } from './tree-data/json_data_1';
import { geneData } from './tree-data/xlsx';
import { renderTree } from './utils/phylogram_d3';

@Component({
  selector: 'app-tree-chart',
  templateUrl: './tree-chart.component.html',
  styleUrls: ['./tree-chart.component.scss'],
})
export class TreeChartComponent implements AfterViewInit {
  treeDataObject = jsonData1
  geneData = geneData
  treeType = 'rectangular'

  constructor(
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    renderTree(this.treeDataObject, '#' + this.treeType, {treeType: this.treeType}, this.geneData)
  }

  changeTreeType(e: any) {
    this.treeType = e.value

    setTimeout(() => {
      if (e.value === 'rectangular') {
        renderTree(this.treeDataObject, '#' + e.value, {treeType: e.value}, this.geneData)
      }
      if (e.value === 'radial') {
        renderTree(this.treeDataObject, '#' + e.value, {treeType: e.value}, this.geneData)
      }
      this.cd.markForCheck()
      this.cd.detectChanges()
    },1000)
  }

}
