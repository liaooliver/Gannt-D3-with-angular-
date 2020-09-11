import { Component, OnInit } from '@angular/core';
import { GanttService } from '../gantt.service';
import { DataSourceService } from '../data-source.service';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent implements OnInit {

  constructor(
    public _gantt: GanttService,
    public _source: DataSourceService
  ) { }

  ngOnInit(): void {
    this.getData()
  }

  public dataSet;

  public getData() {
    this._gantt.getAPI().subscribe((dataSet: []) => {
      this.dataSet = dataSet;

      const copyData = JSON.stringify(dataSet);
      let filterData = JSON.parse(copyData);

      filterData = filterData.filter(item => {
        delete item['tasks']
        return item
      })
      
      this._source.data_center$.next(filterData)
    })
  }

}
