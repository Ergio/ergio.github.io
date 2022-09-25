import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
  selector: 'app-legend-widget',
  templateUrl: './legend-widget.component.html',
  styleUrls: ['./legend-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule]
})
export class LegendWidgetComponent implements OnInit {


  @Input() legendData: any
  @Output() selectOptions: any  = new EventEmitter<any>();

  features = ["GENE_NAME", "CLUSTER", "ORGANISM", "CLUSTER_PRODUCT", "BIOSYNTHETIC_CLASSES", "GENE_PRODUCT", "PROTEIN_ID"]
  
  featureOptions: string[] = []
  procesedFeatureOptions: string[] = []

  formGroup!: FormGroup<any>


  constructor(private _formBuilder: FormBuilder) {}


  ngOnInit(): void {
    console.log(this.legendData)
    const legendDataArr = Object.values(this.legendData)
    this.featureOptions = Array.from(new Set(legendDataArr.map((v: any) => v["BIOSYNTHETIC_CLASSES"])))
    this.procesedFeatureOptions = this.featureOptions.map(v => v && v.trim().replace('\t', '').replace('\n', '; '))
    console.log(this.procesedFeatureOptions)

    const formOptions = this.featureOptions.reduce((acc, cur) => {
      acc[cur] = false;
      return acc
    }, {} as any)

    this.formGroup = this._formBuilder.group(formOptions);
    
    this.formGroup.valueChanges.subscribe(v => {
      this.selectOptions.emit(
        {
          "BIOSYNTHETIC_CLASSES": v
        }
      )
    })

  }

}
