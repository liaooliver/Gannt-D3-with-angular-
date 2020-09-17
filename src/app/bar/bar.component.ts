import { Component, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
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
  // http://bl.ocks.org/TBD/600b23e56545026ae6fda2905efa42ce

  private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  private g: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  private x: d3.ScaleTime<number, number>
  private y: d3.ScaleBand<string>;
  private xAxis: d3.Axis<any>;
  private gGrid: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private update: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>;
  private enter: d3.Selection<any, any, d3.BaseType, unknown>;
  private spanX: (d: any) => number = (d) => this.x(this.parser(d.dates.start))
  private spanW: (d: any) => number = (d) => this.x(this.parser(d.dates.end)) - this.x(this.parser(d.dates.start))
  private parser: (dateString: string) => Date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")
  private tooltip;
  
  private isFirst: boolean = true;
  private size: { [key: string]: number } = {
    margin: 20,
    width: 800,
    height: 300
  }
  

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
    }
  }

  public renderSVG(data): void {
    const _this = this;

    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", this.size.width+ (this.size.margin * 2))
      .attr("height", this.size.height + (this.size.margin * 3))

    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");
    
    this.y = d3.scaleBand()
      .range([0, this.size.height])
      .domain(data.map(d => d.code))
      .padding(0.3);

    this.x = d3.scaleTime()
      .domain([new Date(2020, 2, 1, 0o0, 0o0), new Date(2020, 10, 30, 23, 59)])
      .range([0, this.size.width + (this.size.margin * 2)]);
    
    this.xAxis = d3.axisTop(this.x).tickSize(null)

    this.gGrid = this.g
      .attr("transform", `translate(20, 20)`);

    this.grid(this.gGrid, this.x)
    
    this.zoom = d3.zoom()
    .scaleExtent([1, 160])
    .translateExtent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
    .extent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
    .on("zoom", function (event) {
      _this.zoomed(event)
    });
    
    this.g.append("g")
      .attr('class', 'axis axis--x')
      .attr("transform", "translate(0, -8)")
      .style("font-size", 13)
      .call(this.xAxis)
      .call(g => g.select(".domain").remove())
    
    this.svg.call(this.zoom)
    this.drawBars(data)
  }

  public zoomed(event) {
    var t = event.transform, xt = t.rescaleX(this.x)
    this.g.select(".axis--x")
      .call(this.xAxis.scale(xt))
      .call(g => g.select(".domain").remove())
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

  private makeTooltip(dataSet): void {
    this.tooltip = d3.select("#bar")
    .append("div")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .html(`
        <p>${dataSet.code}</p>
        <p>Type: ${dataSet.type}</p>
        <p>Lanuch period: ${this.timeFormat(dataSet.dates.start)} ~ ${this.timeFormat(dataSet.dates.end)}</p>
      `);
  }

  public timeFormat(time): string {
    const timeAll = new Date(time)
    let Y, m, d, hh, mm;
    Y = timeAll.getFullYear();
    m = timeAll.getMonth()+1;
    d = timeAll.getDate()
    hh = timeAll.getHours()-8
    mm = timeAll.getMinutes();
    return `${Y}-${this.addZero(m)}-${this.addZero(d)} ${this.addZero(hh)}:${this.addZero(mm)}`
  }

  public addZero(value): string {
    return value < 10 ? `0${value}`: value
  }

  private drawBars(data: any[]): void {
    const _this = this;

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
      .attr("fill", (d) => d.color)
      .on("mouseover", function (d) {
        _this.makeTooltip(d.target.__data__)
        _this.tooltip
          .style("top", (d.pageY + 10)+"px").style("left",(d.pageX + 10)+"px")
      })
      .on("mousemove", function (d) {
        let delay = 100;
        let timer = null;

        clearTimeout(timer);
        timer = setTimeout(() => {
          _this.tooltip.style("top", (d.pageY + 10)+"px").style("left",(d.pageX + 10)+"px")
        }, delay)
      })
      .on("mouseout", function () {
        _this.tooltip.remove()
      })

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
