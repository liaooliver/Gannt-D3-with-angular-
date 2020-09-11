import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { GanttService } from '../gantt.service';
import { DataSourceService } from '../data-source.service';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements OnInit {

  private svg;
  private x: d3.ScaleTime<number, number>
  private y: d3.ScaleBand<string>;
  private isFirst: boolean = true;
  private isOpenBar: boolean = true;

  constructor(
    public _gantt: GanttService,
    public _source: DataSourceService
  ) { }


  ngOnInit(): void {
    this._source.data_center$.subscribe(result => this.initData(result))
  }

  public initData(dataSet) {
    if (!dataSet) return;

    const array = this.handleRecursive(dataSet)

    const size = {
      margin: 50,
      width: 1000,
      height: (array.length * 40)
    }

    if (this.isFirst) {
      this.isFirst = !this.isFirst;
      this.renderSVG(array, size)
    } else {
      d3.select('#bar').selectAll('svg').remove();
      this.renderSVG(array, size)
    }
  }

  public renderSVG(array, size) {
    this.createSvg(size);
    this.drawBasic(array, size);
    this.drawAxis(size);
    this.drawBars(array)
  }

  public handleRecursive(dataSet) {
    const array = []
    const recursive = function (dataSet) {
      dataSet.forEach(data => {
        let color: string;
        switch (data.type) {
          case 'order':
            color = '#63b3ed';
            break;
          case 'product':
            color = '#f6e05e';
            break;
          case 'job':
            color = '#68d391';
            break;
        }
        array.push({ ...data, color })

        if (data.tasks) {
          recursive(data.tasks)
        }
      });
    }
    recursive(dataSet)
    return array;
  }

  private createSvg(size): void {
    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", size.width + (size.margin * 2))
      .attr("height", size.height + (size.margin * 2))
      .append("g")
      .attr("transform", "translate(" + (size.margin + 30) + "," + size.margin + ")");
  }

  public drawBasic(data, size) {
    // Create the X-axis band scale 非連續性比例尺
    this.y = d3.scaleBand()
      .range([0, size.height])
      .domain(data.map(d => d.code))
      .padding(0.2);

    // Create the Y-axis band scale
    this.x = d3.scaleTime()
      .domain([new Date(2020, 2, 1), new Date(2020, 7, 31)])
      .range([0, size.width]);

  }

  public drawAxis(size) {
    // Draw the X-axis on the DOM
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + size.height + ")")
      .call(d3.axisBottom(this.x))
      .selectAll("text")
      .attr("transform", "translate(10,0)")
      .style("text-anchor", "end");

    // Draw the Y-axis on the DOM
    // this.svg.append("g")
    //   .attr("class", "y axis")
    //   .call(d3.axisLeft(this.y));
  }

  public redrawAxis(size) {
    // this.svg.select(".y.axis")
    // .call(d3.axisLeft(this.y));
    this.svg.select(".x.axis")
      .call(d3.axisBottom(this.x))
  }

  private drawBars(data: any[]): void {
    // Create and fill the bars
    let bars = this.svg.selectAll('rect');
    let update = bars.data(data);
    let enter = update.enter();
    let exit = update.exit();

    update.attr("x", (d) => this.x(new Date(d.dates.start)))
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.x(new Date(d.dates.end)) - this.x(new Date(d.dates.start)))
      .attr("height", this.y.bandwidth())
      .attr("fill", "#d04a35");

    enter.append("rect")
      .attr("x", (d) => {
        return this.x(new Date(d.dates.start))
      })
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.x(new Date(d.dates.end)) - this.x(new Date(d.dates.start)))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => d.color);

    exit.remove();
  }
}
