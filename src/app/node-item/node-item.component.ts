import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { DataSourceService } from '../data-source.service'

@Component({
  selector: 'app-node-item',
  templateUrl: './node-item.component.html',
  styleUrls: ['./node-item.component.scss']
})
export class NodeItemComponent implements OnInit, OnChanges {

  @Input() dataSet;
  @Input() closeAll;
  public isShow: boolean = false;
  public isClose: boolean = false;
  public dataSource;

  constructor(
    private _source: DataSourceService
  ) { }

  ngOnInit(): void {
    this._source.data_center$.subscribe(result => {
      this.dataSource = result;
    })
  }

  ngOnChanges(): void { 
    if (this.closeAll) this.isShow = false;
  }

  public isToggle(event, dataSet) {
    event.stopPropagation();
    
    if (!dataSet['tasks']) return;
    
    this.isShow = !this.isShow;
    this.isClose = false;

    if (this.isShow) {
      
      let newResult = []
      const tasks = JSON.stringify(dataSet['tasks'])
      let newTasks = JSON.parse(tasks);
      newTasks = newTasks.filter(item => {
        delete item['tasks']
        return item
      })

      switch (dataSet.type) {
        case 'order':
          newResult = this.dataSource.map(item => {
            if (item.id === dataSet.id) {
              return { ...item, tasks: newTasks }
            }
            return item
          })
          break;
        case 'product':
          newResult = this.dataSource.map(item => {
            if (item.id === dataSet.oid) {
              return {
                ...item,
                tasks: item.tasks.map(element => {
                  
                if (element.id === dataSet.id) {
                  return { ...element, tasks: newTasks }
                }
                  return element
                })
              }
            }
            return item
          })
          break;
      }
      console.log("增加 ", newResult)
      this._source.data_center$.next(newResult)
    } else {
      let newResult = []
      
      switch (dataSet.type) {
        case 'order':
          this.isClose = true;
          newResult = this.dataSource.map(item => {
            if (item.id === dataSet.id) {
              delete item['tasks']
              return item
            }
            return item
          })
          break;
        case 'product':
          newResult = this.dataSource.map(item => {
            if (item.id === dataSet.oid) {
              item['tasks'] = item.tasks.map(element => {
                if (element.id === dataSet.id) {
                  delete element['tasks']
                  return element
                }
                return element
              })
              return item
            } 
            return item
          })
          break;
      }
      console.log("減少 ", newResult)
      this._source.data_center$.next(newResult)
    }


  }

}
