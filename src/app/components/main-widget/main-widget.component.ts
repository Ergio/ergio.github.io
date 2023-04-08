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
import { MatProgressBarModule } from '@angular/material/progress-bar';


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
    MatProgressBarModule
  ]
})
export class MainWidgetComponent implements OnInit {
  @Output() changeTreeChartData: EventEmitter<TreeDataType> = new EventEmitter();
  @Output() changeTreeChartType: EventEmitter<'radial' | 'rectangular'> = new EventEmitter();
  @Output() changeTreeChartHideLabels: EventEmitter<boolean> = new EventEmitter();

  dataType: 'abc' | 'mfs' | 'all' | 'transmembrane' | 'notTransmembrane' = 'transmembrane'

  seqType: 'nucleotides' | 'amino_acids' = 'amino_acids'

  treeType: 'radial' | 'rectangular' = 'radial'

  treeDataObject: any = null
  geneData: any = null

  data$ = new BehaviorSubject<any>({
    treeDataObject: null as any,
    geneData: null as any,
  })

  hideLabels = true;

  useLocal = false

  get dataMapExist() {
    return fetchDataMap[this.dataType][this.seqType].treeData
  }
  fetchDataMap = fetchDataMap

  isLoading = false

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

      if (!fetchDataMap[this.dataType][this.seqType].treeData) {
        this.seqType = 'nucleotides' === this.seqType ? 'amino_acids' : 'nucleotides'
      }
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

    this.isLoading = true

    if (fetchDataMap[this.dataType][this.seqType].treeData) {
      Promise.all([
        fetch(fetchDataMap[this.dataType][this.seqType].description, opts),
        fetch(fetchDataMap[this.dataType][this.seqType].treeData!, opts)
      ])
        .then(([response1, response2]) => {

          return Promise.all([response1.json(), response2.json()])
        }).then(([response1, response2]) => {

          this.isLoading = false

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
