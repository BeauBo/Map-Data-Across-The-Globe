import * as d3 from 'd3';
import * as topojson from 'topojson'
require('./css/index.scss')

//variables
var margin = {top: 40, right: 60, bottom: 40, left: 60},
    width  = 1150 - margin.right - margin.left,
    height = 800  - margin.top   - margin.bottom;
    
var urlTopojson = 'https://d3js.org/world-50m.v1.json',
    urlMeteorites = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json';
    
var svg = d3.select('svg')
                .attr('width',width + margin.right + margin.left)
                .attr('height', height + margin.top + margin.bottom)
                
                
var projection = d3.geoMercator()
                    .translate([ width/2, height/2])
                    .scale(200)
                    
var path = d3.geoPath()
                .projection(projection);
                
var map  = svg.append('g'),
    circles = svg.append('g')
    
var tooltip = d3.select('.container')
                    .append('div')
                    .attr('class','tooltip')
                    .attr('opacity','0')
                


d3.json( urlTopojson, (error, data)=>{
    
    
    var countries = topojson.feature(data, data.objects.countries).features;
    
   
    
    
    
    //add path to draw the world map
    
    map.selectAll('.country')
        .data(countries)
        .enter()
        .append('path')
        .attr('class','country')
        .attr('d', path)
        .call(zoom)
        .on("wheel", function() { d3.event.preventDefault(); })
        
    });


d3.json( urlMeteorites, (error, data) => {
   
    var meteorites = data.features;
    var maxMass = d3.max(meteorites, d => Number(d.properties.mass))
    var minMass = d3.min(meteorites, d => Number(d.properties.mass))
    
   //console.log(meteorites)
   
   // sort radius of circles by mass
    var mass = []
    
        meteorites.map((d) => {
        mass.push(Number(d.properties.mass))
    })
    
    var thresholdScott   = d3.thresholdScott(mass, minMass, maxMass) 
    
    var histogram = d3.histogram()
                          .domain([minMass, maxMass])
                          .thresholds(thresholdScott)
    var thresholdsAll = histogram(mass)
    
    thresholdsAll = thresholdsAll.filter(d => d.length > 0);
                                       
    
    var thresholds = []
    thresholdsAll.map((d) => {
        thresholds.push(d.x1)
    })
    
    var raidus = [2, 10, 15, 20, 25, 30, 35, 40]
    
    var sortMass = d3.scaleThreshold()
                    .domain(thresholds)
                    .range(raidus)

    // add circles to the map
    
    var hue = 0;
    
    circles.selectAll('circle')
        .data(meteorites)
        .enter()
        .append('circle')
        .attr('cx', (d) => {return projection([d.properties.reclong,d.properties.reclat])[0]})
        .attr('cy', (d) => {return projection([d.properties.reclong,d.properties.reclat])[1]})
        .attr('r', (d) => { return sortMass(d.properties.mass)})
        .attr('fill-opacity', (d) => {
            
            if( Number(d.properties.mass) <= 200000) return 1;
            return 0.5
        })
        .attr('stroke','gray')
        .attr('stroke-width',0.2)
        .attr('fill',(d) => {
            
            hue += 0.35;
            return 'hsl('+hue+',100%,50%)'
        })
        .on('mouseover', (d) => {
            var xPos = d3.event.pageX + 15 +'px',
                yPos = d3.event.pageY - 10 +'px';
                
            var year = new Date(d.properties.year).getFullYear();
            tooltip.html(`<span>Country: ${d.properties.name}</span><br/><span>Mass: ${d.properties.mass}</span><br/><span>Year: ${year}</span>`)
            tooltip
                .style('opacity','0.9')
                .style('left',xPos)
                .style('top',yPos)
            
        })
        .on('mouseout', (d) => {
            tooltip.attr('opacity','0')
        })
        
    
})

 //add zooming
    
    var zoomed = ()=>{
        map.attr('transform', 'translate('+d3.event.transform.x+','+d3.event.transform.y+')scale('+ d3.event.transform.k+')');
        circles.attr('transform', 'translate('+d3.event.transform.x+','+d3.event.transform.y+')scale('+ d3.event.transform.k+')');
    }
    
    var zoom = d3.zoom()
                    .scaleExtent([0.5, 10])
                    .on('zoom', zoomed)
