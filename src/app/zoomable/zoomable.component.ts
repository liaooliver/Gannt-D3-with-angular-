import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-zoomable',
  templateUrl: './zoomable.component.html',
  styleUrls: ['./zoomable.component.scss']
})
export class ZoomableComponent implements OnInit {

  constructor() { }

  height = 500
  margin = ({top: 20, right: 20, bottom: 30, left: 30})

  ngOnInit(): void {
    
      const zoom = d3.zoom()
        .scaleExtent([1, 32])
        .extent([[margin.left, 0], [width - margin.right, height]])
        .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
        .on("zoom", zoomed);

      const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

      const clip = DOM.uid("clip");

      svg.append("clipPath")
        .attr("id", clip.id)
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

      const path = svg.append("path")
        .attr("clip-path", clip)
        .attr("fill", "steelblue")
        .attr("d", area(data, x));

      const gx = svg.append("g")
        .call(xAxis, x);

      svg.append("g")
        .call(yAxis, y);

      svg.call(zoom)
        .transition()
        .duration(750)
        .call(zoom.scaleTo, 4, [x(Date.UTC(2001, 8, 1)), 0]);

      function zoomed(event) {
      const xz = event.transform.rescaleX(x);
      path.attr("d", area(data, xz));
      gx.call(xAxis, xz);
  
  }
}

}
