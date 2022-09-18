import { AfterViewInit, Component, ChangeDetectorRef } from '@angular/core';
import { jsonData } from './tree-data/json_data';
import { convert_to_newick } from './utils/convert_to_newick';
import { init } from './utils/phylogram_d3';

@Component({
  selector: 'app-tree-chart',
  templateUrl: './tree-chart.component.html',
  styleUrls: ['./tree-chart.component.scss'],
})
export class TreeChartComponent implements AfterViewInit {
  treeType = 'rectangular'
  treeData = '(' + convert_to_newick(jsonData, 0) + ')'

  constructor(
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    init(this.treeData, '#' + this.treeType, {treeType: this.treeType})
  }

  changeTreeType(e: any) {
    this.treeType = e.value

    setTimeout(() => {
      if (e.value === 'rectangular') {
        init(this.treeData, '#' + e.value, {treeType: e.value})
  
      }
      if (e.value === 'radial') {
        init(this.treeData, '#' + e.value, {treeType: e.value})
      }
      this.cd.markForCheck()
      this.cd.detectChanges()
    },1000)
  }

}
