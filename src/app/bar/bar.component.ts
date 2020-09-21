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
  private tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
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
  
  private isFirst: boolean = true;
  private size: { [key: string]: number } = {
    margin: 10,
    width: window.innerWidth*0.6,
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

  public initData(dataSet): void {
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

    // draw SVG size
    this.svg = d3.select("figure#bar")
      .append("svg")
      .attr("width", this.size.width + (this.size.margin * 2))
      .attr("height", this.size.height + (this.size.margin * 3))

    // g is svg element container
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.size.margin + "," + this.size.margin + ")");
    
    // y scale
    this.y = d3.scaleBand()
      .range([0, this.size.height])
      .domain(data.map(d => d.code))
      .padding(0.3);

    // x time scale
    this.x = d3.scaleTime()
      .domain([new Date(2020, 2, 1, 0o0, 0o0), new Date(2020, 10, 30, 23, 59)])
      .range([0, this.size.width + (this.size.margin * 2)]);    
    
    // make x axis
    this.xAxis = d3
      .axisTop(this.x)
      .tickSize(null)

    // make Grid container
    this.gGrid = this.g
      .attr("transform", `translate(20, 20)`);

    // make Grid
    this.grid(this.gGrid, this.x)
    
    // make X axis
    this.g.append("g")
      .attr('class', 'axis axis--x')
      .attr("transform", "translate(0, -8)")
      .style("font-size", 13)
      .call(this.xAxis)
      .call(g => g.select(".domain").remove())
    
    this.makeZoom();
    this.svg.call(this.zoom);
    this.drawBars(data);
  }

  public grid(g, x, component = null): void {
    const _this = this === null ? component : this;

    g.call(g => g.selectAll(".x-grid")
      .data(x.ticks())
      .join(
        enter => enter.append("line")
          .attr("stroke-opacity", 1)
          .attr("stroke", "white")
          .attr('sort', _this.x)
          .attr("class", "x-grid")
          .attr("y2", _this.size.height),
        update => update,
        exit => exit.remove()
      )
      .attr("x1", d => x(d))
      .attr("x2", d => x(d)))
    
    /**
     * sort svg element for z-index: The earlier the svg element, the lower the weight
     * sort way , descending 
    */ 
    g.selectAll('.x-grid').sort(d3.descending)
  }

  private drawBars(data: any[]): void {
    const _this = this;

    // D3.js data join
    this.update = this.g.selectAll('rect').data(data);
    this.enter = this.update.enter();
    let exit = this.update.exit();

    this.update.attr("x", (d) => this.spanX(d))
      .attr("y", d => this.y(d.code))
      .attr("width", (d) => this.spanW(d))
      .attr("height", this.y.bandwidth())
      .attr("rx", 5)
      .attr("fill", "#d04a35");

    this.enter.append("rect")
      .attr("x", (d) => this.spanX(d))
      .attr("y", (d) => this.y(d.code))
      .attr("width", (d) => this.spanW(d))
      .attr("height", this.y.bandwidth())
      .attr("rx", 5)
      .attr("fill", (d) => d.color)
      .on("mouseover", function (d) {
        // create tooltip
        _this.makeTooltip(d.target.__data__)
        _this.tooltip
          .style("top", (d.pageY + 10)+"px").style("left",(d.pageX + 10)+"px")
      })
      .on("mousemove", function (d) {
        let delay = 100;
        let timer = null;

        // debounce function
        clearTimeout(timer);
        timer = setTimeout(() => {
          // follow cursor position
          _this.tooltip.style("top", (d.pageY + 10)+"px").style("left",(d.pageX + 10)+"px")
        }, delay)
      })
      .on("mouseout", function () {
        // remove tooltip
        _this.tooltip.remove()
      })

    exit.remove();
  }

// --------------------- Zoom behavior ------------------- //
  private makeZoom(): void {
    const _this = this;

    this.zoom = d3.zoom()
    .scaleExtent([1, 160])
    .translateExtent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
    .extent([[0, 0], [this.size.width+ (this.size.margin * 2), this.size.height]])
    .on("zoom", function (event) {
      _this.zoomed(event)
    });
  }

  public zoomed(event): void {
    // https://github.com/d3/d3-zoom#zoom-transforms
    var t = event.transform, xt = t.rescaleX(this.x)
    /**
     * transform.x - the translation amount tx along the x-axis.
     * transform.y - the translation amount ty along the y-axis.
     * transform.k - the scale factor k.
    */
    this.gGrid.call(this.grid, xt, this)
    this.g.select(".axis--x")
      .call(this.xAxis.scale(xt))
      .call(g => g.select(".domain").remove())
    this.svg.selectAll("rect")
      .attr("x", (d) => t.applyX(this.spanX(d)))
      .attr("width", (d) => t.k * this.spanW(d))
  }
// --------------------- tooltip ------------------- //
  private makeTooltip(dataSet): void {
    this.tooltip = d3.select("#bar")
    .append("div")
      .attr('class', 'tooltip')
      .html(`
        <p>${dataSet.code}</p>
        <p>Type: ${dataSet.type}</p>
        <p>Lanuch period: ${this.timeFormat(dataSet.dates.start)} ~ ${this.timeFormat(dataSet.dates.end)}</p>
        <p>Progress: ${dataSet.progress}%</p>
        <div class="progress">
          <div class="progress-bar" role="progressbar" style="width: ${dataSet.progress}%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      `);
  }

// --------------- convert time format ------------ //
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
  
// ----------------- handle data ------------------ //
  public handleRecursive(dataSet) {
    const array = []
    const recursive = function (dataSet) {
      dataSet.forEach(data => {
        let color: string;
        switch (data.type) {
          case 'order':
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