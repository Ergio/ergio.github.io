import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSelectModule} from '@angular/material/select';

@Component({
  selector: 'app-legend-widget',
  templateUrl: './legend-widget.component.html',
  styleUrls: ['./legend-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, MatSelectModule]
})
export class LegendWidgetComponent implements OnInit, OnChanges {


  @Input() legendData: any
  @Output() selectOptions: any  = new EventEmitter<any>();

  features = ["GENE_NAME", "CLUSTER", "ORGANISM", "CLUSTER_PRODUCT", "BIOSYNTHETIC_CLASSES", "GENE_PRODUCT", "PROTEIN_ID", "DATA_TYPE"]
  selectedFeature = "BIOSYNTHETIC_CLASSES"
  
  featureOptions: string[] = []
  procesedFeatureOptions: string[] = []
  procesedFeatureOptionsLength: number[] = []

  formGroup!: FormGroup<any>


  constructor(private _formBuilder: FormBuilder) {}


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
    const legendDataArr = Object.values(this.legendData)
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
      const resultMap = legendDataArr.reduce((acc: any, cur: any) => {
        const unique_id = cur['UNIQUE_ID'];
        acc[unique_id] = optionsMap[cur[this.selectedFeature]];
        return acc;
      }, {})
      
      this.selectOptions.emit(
        resultMap
      )
    })
  }

}
