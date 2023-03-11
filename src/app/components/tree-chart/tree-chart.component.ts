import { AfterViewInit, Component, ChangeDetectorRef, Input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LegendWidgetComponent } from '../filters/legend-widget.component';
import { CommonModule } from '@angular/common';
import { TreeRenderer } from './d3-render/tree-render';
import { FormsModule } from '@angular/forms';


import { LegendWidget2Component } from '../search/legend-widget2.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MainWidgetComponent } from '../main-widget/main-widget.component';
import { TreeDataType } from '../main-widget/tree-data-type';
import { downloadTreeChart } from './d3-render/updated-utils/download';
import { MatIconModule } from '@angular/material/icon';


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
    MatButtonModule,
    MainWidgetComponent,
    LegendWidgetComponent,
    LegendWidget2Component,
    FormsModule,
    MatTabsModule,
    MatIconModule
  ]
})
export class TreeChartComponent implements AfterViewInit {
  treeData: TreeDataType = {
    treeDataObject: {},
    geneData: {}
  } as TreeDataType

  treeType: 'radial' | 'rectangular' = 'radial'

  modifiedTreeDataObject: any


  treeRenderer = new TreeRenderer()

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.rerender(this.treeData.treeDataObject, this.treeData.geneData)
  }

  rerender(treeData: any, geneData: any) {
    this.treeRenderer.renderTree(treeData, '#tree-chart', { treeType: this.treeType }, geneData)
  }

  onSelectOptions(e: any) {
    this.treeRenderer.selectLeafs(e, 'green')
  }

  onChangeTreeChartHideLabels(event: boolean) {
    this.treeRenderer.hideLabels(event)
  }

  onChangeTreeChartData(event: TreeDataType) {
    this.treeData = event
    this.treeRenderer = new TreeRenderer()
    this.rerender(event.treeDataObject, event.geneData)
  }

  onChangeTreeChartType(event: 'radial' | 'rectangular') {
    this.treeType = event
    this.treeRenderer = new TreeRenderer()
    this.rerender(this.treeData.treeDataObject, this.treeData.geneData)
  }

  download() {
    downloadTreeChart()
  }
}
