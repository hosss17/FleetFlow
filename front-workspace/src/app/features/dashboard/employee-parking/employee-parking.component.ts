import { Component } from '@angular/core';
import { Parking3dViewComponent } from '../parking-3d';

@Component({
  selector: 'app-employee-parking',
  standalone: true,
  imports: [Parking3dViewComponent],
  templateUrl: './employee-parking.component.html',
  styleUrls: ['./employee-parking.component.css'],
})
export class EmployeeParkingComponent {}
