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
  private xAxis;
  private yAxis;
  private zoom;
  private isFirst: boolean = true;

  constructor(
    public _gantt: GanttService,
    public _source: DataSourceService
  ) { }


  ngOnInit(): void {
    this._source.data_center$.subscribe(result => this.initData(result))
  }

  public initData(dataSet) {
    if (!dataSet) return;

    const array = this.handleRecursive(dataSet);
    const size = {
      margin: 20,
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
    this.zoomed(size)
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

  private createSvg(size): void {
    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", size.width + (size.margin * 2))
      .attr("height", size.height + (size.margin * 2))
      .append("g")
      .attr("transform", "translate(" + size.margin + "," + size.margin*2 + ")");
  }

  public zoomed({ width, height }) {
    const _this = this;
    
    d3.select("figure#bar svg")
      .call(d3.zoom()
        .scaleExtent([1, 3])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", function (event) {
          var t = event['transform'], xt = t.rescaleX(_this.x);
          d3.select('.x .axis').call(_this.xAxis.scale(xt))
          console.log("zoom: ", event, "T", t, "XT", xt)
        })
    )
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
    this.xAxis = this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + -10 + ")")
      .call(d3.axisTop(this.x).tickSize(null))
      // .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
        .attr("y2", (size.height+15))
        .attr("stroke-opacity", 0.3))
      .selectAll("text")
      .attr("transform", "translate(10, -10)")
      .style("text-anchor", "end");

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
      .attr("x", d => this.x(new Date(d.dates.start)))
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.x(new Date(d.dates.end)) - this.x(new Date(d.dates.start)))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => d.color);

    exit.remove();
  }
}
