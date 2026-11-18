import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function RouteGlobe({ height = 480 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const radius = Math.min(width, height) / 2.3;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'overflow: visible;');

    const defs = svg.append('defs');

    // Globe Glow
    const globeGlow = defs.append('radialGradient')
      .attr('id', 'globeGlow')
      .attr('cx', '50%').attr('cy', '50%')
      .attr('r', '50%');
    globeGlow.append('stop').attr('offset', '70%').attr('stop-color', '#120a2e').attr('stop-opacity', 0.9);
    globeGlow.append('stop').attr('offset', '100%').attr('stop-color', '#8b20ff').attr('stop-opacity', 0.25);

    const projection = d3.geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate([-77, -11]); // Centered on Coimbatore, India

    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule10();

    // Base Sphere
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius)
      .attr('fill', 'url(#globeGlow)')
      .attr('stroke', 'rgba(139, 32, 255, 0.4)')
      .attr('stroke-width', 1.5);

    // Graticules
    svg.append('path')
      .datum(graticule)
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(139, 32, 255, 0.15)')
      .attr('stroke-width', 0.8);

    // Hubs: Coimbatore (Origin) + Global Nodes
    const coimbatore = [76.9558, 11.0168];
    const destinations = [
      { name: 'Dubai', coords: [55.2708, 25.2048] },
      { name: 'Singapore', coords: [103.8198, 1.3521] },
      { name: 'Frankfurt', coords: [8.6821, 50.1109] },
      { name: 'London', coords: [-0.1278, 51.5074] },
      { name: 'Sydney', coords: [151.2093, -33.8688] },
      { name: 'Riyadh', coords: [46.6753, 24.7136] },
    ];

    // Flight arcs
    const routesGroup = svg.append('g').attr('class', 'routes-group');

    destinations.forEach((dest) => {
      const lineString = {
        type: 'LineString',
        coordinates: [coimbatore, dest.coords],
      };

      routesGroup.append('path')
        .datum(lineString)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#a855f7')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4')
        .attr('opacity', 0.7);

      const destPos = projection(dest.coords);
      if (destPos) {
        svg.append('circle')
          .attr('cx', destPos[0])
          .attr('cy', destPos[1])
          .attr('r', 3)
          .attr('fill', '#00f0ff')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
      }
    });

    // Coimbatore Core Hub
    const cbePos = projection(coimbatore);
    if (cbePos) {
      svg.append('circle')
        .attr('cx', cbePos[0])
        .attr('cy', cbePos[1])
        .attr('r', 5)
        .attr('fill', '#10b981')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
    }

    // Gentle Auto-rotation
    let timer = d3.timer((elapsed) => {
      projection.rotate([-77 + elapsed * 0.008, -11]);
      svg.selectAll('path').attr('d', path);
      // Re-position destination pins
      // Dest pins
    });

    return () => {
      timer.stop();
    };
  }, [height]);

  return (
    <div
      ref={containerRef}
      className="realistic-globe-canvas"
      style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    />
  );
}

