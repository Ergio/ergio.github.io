import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-legend-widget2',
  templateUrl: './legend-widget2.component.html',
  styleUrls: ['./legend-widget2.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatChipsModule, MatButtonModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, MatIconModule, MatCheckboxModule, MatCardModule, MatSelectModule]
})
export class LegendWidget2Component implements OnInit, OnChanges {


  @Input() set legendData(data: any) {
    this.legendD = data
    this.features = Object.keys(data[Object.keys(data)[0]])
  }

  @Input() set resetData(data: any) {
    // this.formGroup && this.formGroup.reset();
  }

  legendD = {}
  @Output() selectOptions: any = new EventEmitter<any>();


  searchValue = '';
  searchList: string[] = [];
  features: string[] = []
  selectedFeature = "BIOSYNTHETIC_CLASS"

  featureOptions: string[] = []
  procesedFeatureOptions: string[] = []
  procesedFeatureOptionsLength: number[] = []

  resultMap: any = {}

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.init()
  }

  ngOnChanges(): void {
    this.init()
  }

  onFeatureChange(e: any) {
    this.init()
  }

  init() {
    const legendDataArr = Object.values(this.legendD)
    const selectedOptionArr = legendDataArr.map((v: any) => v[this.selectedFeature])
    this.featureOptions = Array.from(new Set(selectedOptionArr))

    this.featureOptions = this.featureOptions.sort((a, b) => {
      const a_l = selectedOptionArr.filter(v => v === a).length
      const b_l = selectedOptionArr.filter(v => v === b).length
      return b_l - a_l
    })

    this.procesedFeatureOptions = this.featureOptions.map(v => v && v.trim().replace('\t', '').replace('\n', '; '))

    this.procesedFeatureOptionsLength = this.featureOptions.map(
      option => selectedOptionArr.filter(v => v === option).length
    )



  }

  search() {
    const legendDataArr = Object.values(this.legendD)

    this.resultMap = legendDataArr.reduce((acc: any, cur: any) => {
      const unique_id = cur['UNIQUE_ID'];
      const selectedText = cur[this.selectedFeature]
      const formatedText = `${selectedText}`.toLowerCase()
      const searchArr = this.searchValue ? [this.searchValue.toLowerCase(), ...this.searchList] : this.searchList
      acc[unique_id] = searchArr.some(t => formatedText.includes(t)) ? 'red' : false;

      return acc;
    }, {})

    this.selectOptions.emit(
      this.resultMap
    )
  }
  add() {
    if (this.searchValue) {
      this.searchList.push(this.searchValue.toLowerCase())
    }
  }


  removeKeyword(k: any) {
    const index = this.searchList.indexOf(k);
    this.searchList.splice(index, 1);
  }
}
