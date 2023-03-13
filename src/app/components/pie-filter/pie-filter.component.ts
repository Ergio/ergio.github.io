import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { colorArr } from "./color_arr";

@Component({
  selector: 'app-pie-filter',
  templateUrl: './pie-filter.component.html',
  styleUrls: ['./pie-filter.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, MatSelectModule]
})
export class PieFilterComponent implements OnInit, OnChanges {


  @Input() set legendData(data: any) {
    if (data) {
      this.legendD = data
      this.features = Object.keys(data[Object.keys(data)[0]])
    }

  }

  @Input() set resetData(data: any) {
    this.formGroup && this.formGroup.reset();
  }

  legendD: any = null
  @Output() selectOptions: any = new EventEmitter<any>();

  features: string[] = []
  selectedFeature = "BIOSYNTHETIC_CLASS"

  featureOptions: string[] = []
  procesedFeatureOptions: string[] = []
  procesedFeatureOptionsLength: number[] = []

  formGroup!: FormGroup<any>

  colorMap = colorArr;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit(): void {
    if (this.legendD) {
      this.init()

    }
  }

  ngOnChanges(): void {
    if (this.legendD) {
      this.init()

    }
  }

  onFeatureChange(e: any) {
    this.formGroup && this.formGroup.reset();
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

    const formOptions = this.featureOptions.reduce((acc, cur) => {
      acc[cur] = false;
      return acc
    }, {} as any)

    this.formGroup = this._formBuilder.group(formOptions);

    this.formGroup.valueChanges.subscribe(optionsMap => {

      let colorOptionMap = this.featureOptions.reduce((acc, option, index) => {
        acc[option + '_color_option'] = optionsMap[option] ? colorArr[index] : ''
        return acc;
      }, {} as any)

      const resultMap = legendDataArr.reduce((acc: any, cur: any) => {
        const unique_id = cur['UNIQUE_ID'];
        acc[unique_id] = colorOptionMap[cur[this.selectedFeature] + '_color_option'];
        return acc;
      }, {})

      this.selectOptions.emit(
        resultMap
      )
    })
  }
}
