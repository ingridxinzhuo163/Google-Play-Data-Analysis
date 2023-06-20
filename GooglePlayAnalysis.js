'use strict';
console.log('Hello!');

const color_scale = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'];
dc.config.defaultColors(color_scale);



const addkey = (obj, key, v) => obj[key] = obj[key] ? obj[key] + v : v;

let group;
d3.csv('apps.csv').then(apps => {
    d3.csv('reviews.csv').then(reviews => {
        reviews = reviews.reduce((acc, v) => {
            if (!acc[v.App]) acc[v.App] = {};
            const i = v['Sentiment_Polarity'];
            const j = v['Sentiment_Subjectivity'];
            let obj = acc[v.App];
            if (+i) {
                obj.count = obj.count ? obj.count + 1 : 1;
                obj.avg_pol = obj.avg_pol || 0;
                obj.avg_pol += (+i - obj.avg_pol) / obj.count;
                obj.avg_sub = obj.avg_sub || 0;
                obj.avg_sub += (+j - obj.avg_sub) / obj.count;
            }
            return acc;
        }, {});

        apps = apps.reduce((acc, d) => {
            const r = reviews[d.App];
            if (r) {
                d.Polarity = r.avg_pol;
                d.Subjectivity = r.avg_sub;
                acc = acc.concat(d);
            } else {
                acc = acc.concat(d);
            }
            return acc;
        }, []);

        const itonum = i => parseInt(i.replace(/\+/g, "").replace(/,/g, ""));

        apps = apps.map(d => {
            d.NInstalls = itonum(d.Installs);
            return d;
        });

        apps.sort((a, b) => a.NInstalls - b.NInstalls);
        console.log(apps.map(a => a.NInstalls));
        //using crossfilter
        apps = crossfilter(apps);

        const ratingDim = apps.dimension(d => +d.Rating);
        const catDim = apps.dimension(d => d.Category);
        const reviewsDim = apps.dimension(d => +d.Reviews);
        const polDim = apps.dimension(d => [d.Polarity, +d.Rating]);
        const subDim = apps.dimension(d => [d.Subjectivity, +d.Rating]);
        const typeDim = apps.dimension(d => d.Type);
        const insDim = apps.dimension(d => d.Installs);
        //const bubbleColorScale = d3.scale.ordinal().domain(["000","1000","2000","3000"])
        //.range(["#FF0000", "#ffe119", "#f58231", "4363d8"]);
        var myWords = [{word: "Unrelated", size: "10"}, {word: "Adults only 18+", size: "20"}, {word: "Teen", size: "50"}, {word: "Everyone 10+", size: "30"}, {word: "Mature 17+", size: "40"}, {word: "Everyone", size: "60"} ]
        var rateAndViewDimension = apps.dimension(function(d) {
   return [d.Rating,d.Reviews];
        
});

        group = insDim.group();

        //app rating barchart
        dc.barChart('#ratingchart')
            .x(d3.scaleLinear().domain([0, 5.2]))
            .xAxisLabel('Rating distribution')
            .elasticY(true)
            .barPadding(15)
            .dimension(ratingDim)
            .group(ratingDim.group())
            .render();

        //app category pie chart
        dc.pieChart('#catchart')
            .height(300)
            .cap(19)
            .renderTitle('App Category')
            .innerRadius(70)
            .legend(dc.legend())
            .dimension(catDim)
            .group(catDim.group())
            .render();

        //free or paid (type) pie chart
        dc.pieChart('#typeDimChart')
            .height(300)
            .cap(19)
            .innerRadius(70)
            .legend(dc.legend())
            .dimension(typeDim)
            .group(typeDim.group())
            .render();
        
        //reviews barchart
        dc.barChart("#reviewsChart")
            .x(d3.scaleLinear().domain([1000,1500000]))
            .y(d3.scaleLinear().domain([0,5]))
            .yAxisLabel("frequency")
            .xAxisLabel('Reviews amount')
            .dimension(reviewsDim)
            .group(reviewsDim.group())
            .render();

        //bubble chart
        dc.bubbleChart('#bubblechart')
        // (_optional_) define chart transition duration, `default = 750`
        .transitionDuration(1500)
        .dimension(rateAndViewDimension)
        .group(rateAndViewDimension.group())
        //decide colour
        .colorAccessor(function(d){
            
                   if(d.key[0] < 2)
                     return "000";
                   else if (d.key[0] >= 2 && d.key[0] < 3)
                     return "1000";
                   else if (d.key[0] >= 3 && d.key[0] < 4)
                     return "2000";
                    else
                     return "3000";
                })
        // `.keyAccessor` - the `X` value will be passed to the `.x()` scale to determine pixel location
        .keyAccessor(function (p) {
            return p.key[0];})
        // `.valueAccessor` - the `Y` value will be passed to the `.y()` scale to determine pixel location
        .valueAccessor(function (p) {
            return p.key[1];})
        // `.radiusValueAccessor` - the value will be passed to the `.r()` scale to determine radius size;
        .radiusValueAccessor(function (p) {
            return p.value/10;})
        .maxBubbleRelativeSize(0.3)
        .x(d3.scaleLinear().domain([1,5]))
        .y(d3.scaleLinear().domain([100,200000]))
        .r(d3.scaleLinear().domain([0, 20]))
        //`.elasticY` and `.elasticX` determine whether the chart should rescale each axis to fit the data.
        .elasticY(true)
        .elasticX(true)
       .yAxisPadding(20)
       //.xAxisPadding(500)
        // (_optional_) render horizontal grid lines, `default=false`
        .renderHorizontalGridLines(true)
        // (_optional_) render vertical grid lines, `default=false`
        .renderVerticalGridLines(true)
        // (_optional_) render an axis label below the x axis
        .xAxisLabel('Rating')
        // (_optional_) render a vertical axis lable left of the y axis
        .yAxisLabel('Reviews')
        .renderLabel(false)
        .render();
   
        // set the dimensions and margins of the graph
        var margin = {top: 0, right: 10, bottom: 10, left: 10},
            width = 450 - margin.left - margin.right,
            height = 450 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#my_dataviz").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        // Constructs a new cloud layout instance. It run an algorythm to find the position of words that suits your requirements
        // Wordcloud features that are different from one word to the other must be here
        var layout = d3.layout.cloud()
          .size([width, height])
          .words(myWords.map(function(d) { return {text: d.word, size:d.size}; }))
          .padding(5)        //space between words
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .fontSize(function(d) { return d.size; })      // font size of words
          .on("end", draw);
        layout.start();
                function draw(words) {
          svg
            .append("g")
              .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
              .selectAll("text")
                .data(words)
              .enter().append("text")
                .style("font-size", function(d) { return d.size; })
                .style("fill", "#69b3a2")
                .attr("text-anchor", "middle")
                .style("font-family", "Impact")
                .attr("transform", function(d) {
                  return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; })
                     .render();
        }

    }).catch(err => console.error(err));
}).catch(err => console.error(err));
