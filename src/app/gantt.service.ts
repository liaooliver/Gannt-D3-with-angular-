import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GanttService {

  constructor(public _http: HttpClient) { }

  getAPI() {
    // return this._http.get('http://10.101.100.112:3789/order/list_orders')
    return this._http.get('https://liaooliver.github.io/Gannt-D3-with-angular-/assets/data.json')
  }
}
