import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-gene-details',
  templateUrl: './gene-details.component.html',
  styleUrls: ['./gene-details.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, MatSelectModule]
})
export class GeneDetailsComponent implements OnInit {
  @Input() set data(data: any) {
    this.geneData = Object.entries(data)
  }

  geneData!: [string, string][];
  constructor() { }

  ngOnInit(): void {
  }

}
