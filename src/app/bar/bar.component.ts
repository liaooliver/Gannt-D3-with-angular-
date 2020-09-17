import { Component, OnInit, ɵCompiler_compileModuleSync__POST_R3__ } from '@angular/core';
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
  private update;
  private enter;
  private spanX;
  private spanW;
  private parser = d3.isoParse
  
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

    this.size.height = array.length * 40

    if (this.isFirst) {
      this.isFirst = !this.isFirst;
      this.renderSVG(array)
    } else {
      d3.select('#bar').selectAll('svg').remove();
      this.renderSVG(array)
      // this.drawBars(array)
    }
  }

  public renderSVG(data): void {
    const _this = this;

    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", this.size.width+ (this.size.margin * 2))
      .attr("height", this.size.height + (this.size.margin * 2))
    
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");
    
    this.y = d3.scaleBand()
      .rangeRound([0, this.size.height])
      .domain(data.map(d => d.code))
      .padding(0.2);

    this.x = d3.scaleTime()
      .domain([new Date(2020, 2, 1, 0o0, 0o0), new Date(2020, 10, 30, 23, 59)])
      .rangeRound([0, this.size.width + (this.size.margin * 2)]);
    
    this.spanX = (d) => this.x(this.parser(d.dates.start))
    this.spanW = (d) => this.x(this.parser(d.dates.end)) - this.x(this.parser(d.dates.start))
    
    this.xAxis = d3.axisTop(this.x).tickSize(null)

    this.gGrid = this.g
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");

    this.grid(this.gGrid, this.x)
    
    this.zoom = d3.zoom()
    .scaleExtent([1, 108])
    .translateExtent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
    .extent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
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
    console.log(event)
    
    var t = event.transform, xt = t.rescaleX(this.x)
    this.g.select(".axis--x").call(this.xAxis.scale(xt))
    this.gGrid.call(this.grid, xt, this)
    this.svg.selectAll("rect")
      .attr("x", (d) => t.applyX(this.spanX(d)))
      .attr("width", (d) => t.k * this.spanW(d))
  }

  public grid(g, x, component = null) {
    const _this = this === null ? component : this;
    
    g.call(g => g
      .selectAll(".x")
      .data(x.ticks())
      .join(
        enter => enter.append("line")
          .attr("stroke-opacity", 1)
          .attr("stroke", "black")
          .attr("class", "x")
          .attr("y2", _this.size.height),
        update => update,
        exit => exit.remove()
      )
      .attr("x1", d => x(d))
      .attr("x2", d => x(d)))
  }

  private drawBars(data: any[]): void {
    console.log(data)
    // Create and fill the bars
    this.update = this.g.selectAll('rect').data(data);
    this.enter = this.update.enter();
    let exit = this.update.exit();

    this.update.attr("x", (d) => this.spanX(d))
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.spanW(d))
      .attr("height", this.y.bandwidth())
      .attr("rx", 3)
      .attr("fill", "#d04a35");

    this.enter.append("rect")
      .attr("x", (d) => this.spanX(d))
      .attr("y", (d) => this.y(d.code))
      .attr("width", (d) => this.spanW(d))
      .attr("height", this.y.bandwidth())
      .attr("rx", 4)
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
