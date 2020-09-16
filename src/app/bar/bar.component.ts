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
  // https://observablehq.com/@d3/zoomable-area-chart?collection=@d3/d3-zoom
  // https://bl.ocks.org/mbostock/431a331294d2b5ddd33f947cf4c81319

  private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  private g;
  private x: d3.ScaleTime<number, number>
  private y: d3.ScaleBand<string>;
  private xAxis: d3.Axis<any>;
  private gGrid;
  private zoom;
  
  private size = {
    margin: 20,
    width: 800,
    height: 300
  }
  
  private isFirst: boolean = true;

  constructor(
    public _gantt: GanttService,
    public _source: DataSourceService
  ) { }


  ngOnInit(): void {
    this._source.data_center$.subscribe(result => {
      this.initData(result)
    })
  }

  public initData(dataSet) {
    if (!dataSet) return;

    const array = this.handleRecursive(dataSet);

    if (this.isFirst) {
      this.isFirst = !this.isFirst;
      this.renderSVG(array)
    } else {
      d3.select('#bar').selectAll('svg').remove();
      this.renderSVG(array)
    }
  }

  public renderSVG(data): void {
    const _this = this;

    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", this.size.width + (this.size.margin * 2))
      .attr("height", this.size.height + (this.size.margin * 2))
    
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");
    
    this.y = d3.scaleBand()
      .range([0, this.size.height])
      .domain(data.map(d => d.code))
      .padding(0.2);

    this.x = d3.scaleTime()
      .domain([new Date(2020, 2, 1), new Date(2020, 7, 31)])
      .range([0, this.size.width]);
    
    this.xAxis = d3.axisTop(this.x).tickSize(null)

    this.gGrid = this.svg
      .append('g')
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");

    this.grid(this.gGrid, this.x)
    
    this.zoom = d3.zoom()
    .scaleExtent([1, 4])
    .translateExtent([[0, 0], [this.size.width, this.size.height]])
    .extent([[0, 0], [this.size.width, this.size.height]])
    .on("zoom", function (event) {
      _this.zoomed(event)
    });
    
    this.g.append("g")
      .attr('class', 'axis axis--x')
      .attr("transform", "translate(0, -8)")
      .call(this.xAxis)
    
    this.svg.call(this.zoom)
    
    this.drawBars(data)
  }

  public zoomed(event) {
    var t = event.transform, xt = t.rescaleX(this.x);
    this.g.select(".axis--x").call(this.xAxis.scale(xt))
    this.gGrid.call(this.grid, xt, this)
  }

  public grid(g, x, component = null) {
    const _this = this === null ? component : this;
    
    g.attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.1)
    .call(g => g
      .selectAll(".x")
      .data(x.ticks())
      .join(
        enter => enter.append("line")
          .attr("class", "x")
          .attr("y2", _this.size.height),
        update => update,
        exit => exit.remove()
      )
      .attr("x1", d => x(d))
      .attr("x2", d => x(d)))
  }


  // public drawAxis(size) {
  //   // Draw the X-axis on the DOM
  //   this.xAxis = this.svg.append("g")
  //     .attr("class", "x axis")
  //     .attr("transform", "translate(0," + -10 + ")")
  //     .call(d3.axisTop(this.x).tickSize(null))
  //     // .call(g => g.select(".domain").remove())
  //     .call(g => g.selectAll(".tick line").clone()
  //       .attr("y2", (size.height+15))
  //       .attr("stroke-opacity", 0.3))
  //     .selectAll("text")
  //     .attr("transform", "translate(10, -10)")
  //     .style("text-anchor", "end");

  // }

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
      .attr("x", d => this.x(new Date(d.dates.start)))
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.x(new Date(d.dates.end)) - this.x(new Date(d.dates.start)))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => d.color);

    exit.remove();
  }


// --------------------- 資料整理 ------------------- //
  public handleRecursive(dataSet) {
    const array = []
    const recursive = function (dataSet) {
      dataSet.forEach(data => {
        let color: string;
        switch (data.type) {
          case 'order':
            // color = '#63b3ed';
            color = '#03d3fc'
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
}
