import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {

  constructor() { }

  public data_center$ = new BehaviorSubject(null)
}
