import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { colorArr } from "./color_arr";
import { multipleValuesFeatures } from "src/app/const/multipleValuesFeatures";

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

    if (multipleValuesFeatures.includes(this.selectedFeature)) {
      this.featureOptions = Array.from(new Set(selectedOptionArr.map(v => v.split('; ')).flat()))

      this.featureOptions = this.featureOptions.sort((a, b) => {
        const a_l = selectedOptionArr.filter(v => v.includes(a)).length
        const b_l = selectedOptionArr.filter(v => v.includes(b)).length
        return b_l - a_l
      })
    }





    this.procesedFeatureOptions = this.featureOptions.map(v => v && v.trim().replace('\t', '').replace('\n', '; '))


    this.procesedFeatureOptionsLength = this.featureOptions.map(
      option => selectedOptionArr.filter(v => v === option).length
    )

    if (multipleValuesFeatures.includes(this.selectedFeature)) {
      this.procesedFeatureOptionsLength = this.featureOptions.map(
        option => selectedOptionArr.filter(v => v.includes(option)).length
      )
    }



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

      if (multipleValuesFeatures.includes(this.selectedFeature)) {
        let colorOptionMap = this.featureOptions.reduce((acc, option, index) => {
          acc[option] = colorArr[index];
          return acc;
        }, {} as any)

        const selectedOptions = Object.entries(optionsMap).reduce((acc: any, [k, v]: any) => {
          if (optionsMap[k]) {
            acc.push(k)
          }
          return acc
        }, [])

        function findCommonElements(arr1: any[], arr2: any[]) {
          // Convert arrays to sets for easy comparison
          const set1 = new Set(arr1);
          const set2 = new Set(arr2);
          // Find the intersection of the two sets
          const intersection = new Set([...set1].filter(x => set2.has(x)));
          // Convert the intersection back to an array and return it
          return Array.from(intersection);
        }

        const resultMap = legendDataArr.reduce((acc: any, cur: any) => {
          const unique_id = cur['UNIQUE_ID'];
          const matches = cur[this.selectedFeature].split('; ')

          const common = findCommonElements(matches, selectedOptions)[0]

          acc[unique_id] = common ? colorOptionMap[common] : ''
          return acc;
        }, {})


        this.selectOptions.emit(

          {
            type: 'includes',
            resultMap
          }
        )
      } else {
        this.selectOptions.emit(

          {
            type: 'equal',
            resultMap
          }
        )
      }


    })
  }
}
