import { AfterViewInit, Component, OnInit } from '@angular/core';
import { jsonData } from './tree-data/json_data';
import { convert_to_newick } from './utils/convert_to_newick';
import { init } from './utils/phylogram_d3';

@Component({
  selector: 'app-tree-chart',
  templateUrl: './tree-chart.component.html',
  styleUrls: ['./tree-chart.component.scss'],
})
export class TreeChartComponent implements AfterViewInit {

  constructor() {

    
   }

  ngAfterViewInit(): void {
    const treeData = '(' + convert_to_newick(jsonData, 0) + ')'
    init(treeData, '#phylogram', {})
  }

}
