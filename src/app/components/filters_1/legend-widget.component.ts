import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { colorArr } from "./color_arr";

@Component({
  selector: 'app-legend-widget',
  templateUrl: './legend-widget.component.html',
  styleUrls: ['./legend-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, MatSelectModule]
})
export class LegendWidgetComponent implements OnInit, OnChanges {


  @Input() set legendData(data: any) {
    this.legendD = data
    this.features = Object.keys(data[Object.keys(data)[0]])
  }

  @Input() set resetData(data: any) {
    this.formGroup && this.formGroup.reset();
  }

  legendD = {}
  @Output() selectOptions: any = new EventEmitter<any>();

  features: string[] = []
  selectedFeature = "BIOSYNTHETIC_CLASS"

  featureOptions: string[] = []
  procesedFeatureOptions: string[] = []
  procesedFeatureOptionsLength: number[] = []

  formGroup!: FormGroup<any>

  colorMap = colorArr;


  gradiaenArr = [...Array(100).keys()]

  constructor(private _formBuilder: FormBuilder) { }


  ngOnInit(): void {
    this.init()
  }

  ngOnChanges(): void {
    this.init()
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

      let colorOptionMap = Object.entries(optionsMap).reduce((acc, [k, val], index) => {
        acc[k] = val ? colorArr[index] : val
        return acc;
      }, {} as any)
      if (this.selectedFeature === "LENGTH") {
        colorOptionMap = Object.entries(optionsMap).reduce((acc, [k, val], index) => {
          acc[k] = val ? this.perc2color(k) : val

          return acc;
        }, {} as any)
      }

      const resultMap = legendDataArr.reduce((acc: any, cur: any) => {
        const unique_id = cur['UNIQUE_ID'];
        acc[unique_id] = colorOptionMap[cur[this.selectedFeature]];
        return acc;
      }, {})

      this.selectOptions.emit(
        resultMap
      )
    })
  }


  perc2color(k: string | number) {
    let perc = (+k) / 40

    var r, g, b = 0;
    if (perc < 50) {
      r = 255;
      g = Math.round(5.1 * perc);
    }
    else {
      g = 255;
      r = Math.round(510 - 5.10 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
  }

}
