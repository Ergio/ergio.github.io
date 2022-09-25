import { AfterViewInit, Component, ChangeDetectorRef } from '@angular/core';
import { jsonData1 } from './tree-data/json_data_1';
import { geneData } from './tree-data/xlsx';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { LegendWidgetComponent } from '../legend-widget/legend-widget.component';
import { CommonModule } from '@angular/common';
import { TreeRenderer } from './d3-render/tree-render';
import { FormsModule } from '@angular/forms';

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
  treeDataObject = jsonData1
  geneData = geneData
  treeType = 'radial'

  hideLabels = true;
  treeRenderer = new TreeRenderer()

  constructor(
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {

    this.treeRenderer.renderTree(this.treeDataObject, '#' + this.treeType, {treeType: this.treeType}, this.geneData)
    // renderTree
  }

  changeTreeType(e: any) {
    this.treeType = e.value

    setTimeout(() => {
      if (e.value === 'rectangular') {
        this.treeRenderer.renderTree(this.treeDataObject, '#' + e.value, {treeType: e.value}, this.geneData)
      }
      if (e.value === 'radial') {
        this.treeRenderer.renderTree(this.treeDataObject, '#' + e.value, {treeType: e.value}, this.geneData)
      }
      this.cd.markForCheck()
      this.cd.detectChanges()
    },1000)
  }

  onSelectOptions(e: any) {
    this.treeRenderer.selectLeafs(e)
  }

  onHideLabels() {
    this.treeRenderer.hideLabels(this.hideLabels)
  }
}
