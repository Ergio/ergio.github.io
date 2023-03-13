import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TreeRenderer } from '../tree-chart/d3-render/tree-render';
import { dataMap } from './dataMap';
import { TreeDataType } from './tree-data-type';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { fetchDataMap } from './fetchDataMap';
import { BehaviorSubject } from 'rxjs';



@Component({
  selector: 'app-main-widget',
  templateUrl: './main-widget.component.html',
  styleUrls: ['./main-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule,
  ]
})
export class MainWidgetComponent implements OnInit {
  @Output() changeTreeChartData: EventEmitter<TreeDataType> = new EventEmitter();
  @Output() changeTreeChartType: EventEmitter<'radial' | 'rectangular'> = new EventEmitter();
  @Output() changeTreeChartHideLabels: EventEmitter<boolean> = new EventEmitter();

  dataType: 'abc' | 'mfs' | 'all' | 'transmembrane' | 'notTransmembrane' = 'transmembrane'

  seqType: 'nucleotides' | 'amino_acids' = 'amino_acids'

  treeType: 'radial' | 'rectangular' = 'radial'

  treeDataObject: any = dataMap[this.dataType][this.seqType].treeData

  geneData: any = dataMap[this.dataType][this.seqType].description

  data$ = new BehaviorSubject<any>({
    treeDataObject: null as any,
    geneData: null as any,
  })

  hideLabels = true;

  useLocal = true

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setGeneData()
  }


  onHideLabels() {
    this.changeTreeChartHideLabels.emit(this.hideLabels)
  }

  changeData(e: any) {
    if (e.value !== this.dataType) {
      this.dataType = e.value
      this.setGeneData()
    }
  }

  changeSeqType(e: any) {
    if (e.value !== this.seqType) {
      this.seqType = e.value
      this.setGeneData()
    }
  }

  changeTreeType(e: { value: 'radial' | 'rectangular' }) {
    if (this.treeType !== e.value) {
      this.treeType = e.value
      this.changeTreeChartType.next(this.treeType)
    }
  }



  emitChangeTreeChartData() {
    this.changeTreeChartData.emit({
      treeDataObject: this.treeDataObject,
      geneData: this.geneData
    })
  }

  setGeneData() {

    if (this.useLocal) {

      this.treeDataObject = dataMap[this.dataType][this.seqType].treeData
      this.geneData = dataMap[this.dataType][this.seqType].description
      this.emitChangeTreeChartData()
      return;
    }

    const opts = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }

    console.log(this.dataType)
    console.log(this.seqType)
    console.log()

    if (fetchDataMap[this.dataType][this.seqType].treeData) {
      console.log(fetchDataMap[this.dataType][this.seqType].treeData)
      console.log(fetch(fetchDataMap[this.dataType][this.seqType].description, opts))
      Promise.all([
        fetch(fetchDataMap[this.dataType][this.seqType].description, opts),
        fetch(fetchDataMap[this.dataType][this.seqType].treeData!, opts)
      ])
        .then(([response1, response2]) => {

          return Promise.all([response1.json(), response2.json()])
        }).then(([response1, response2]) => {

          this.treeDataObject = response2
          this.geneData = response1

          this.data$.next({
            treeDataObject: response2,
            geneData: response1,
          })
          this.cd.markForCheck()
          this.emitChangeTreeChartData()
        })
    }
  }
}
