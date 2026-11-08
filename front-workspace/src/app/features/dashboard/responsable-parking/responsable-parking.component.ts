import { Component } from '@angular/core';
import { Parking3dViewComponent } from '../parking-3d';

@Component({
  selector: 'app-responsable-parking',
  standalone: true,
  imports: [Parking3dViewComponent],
  templateUrl: './responsable-parking.component.html',
  styleUrls: ['./responsable-parking.component.css'],
})
export class ResponsableParkingComponent {}
