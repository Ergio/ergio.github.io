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

  treeDataObject = abcData
  geneData = abcDataXlsx

  treeType = 'radial'

  hideLabels = true;
  treeRenderer = new TreeRenderer()

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.rerender()
  }

  rerender() {
    this.treeRenderer.renderTree(this.treeDataObject, '#tree-chart', { treeType: this.treeType }, this.geneData)
  }

  changeTreeType(e: any) {
    if (this.treeType !== e.value) {
      this.treeType = e.value
      this.treeRenderer = new TreeRenderer()
      this.rerender()
    }
  }

  onSelectOptions(e: any) {
    this.treeRenderer.selectLeafs(e)
  }

  onHideLabels() {
    this.treeRenderer.hideLabels(this.hideLabels)
  }
}
