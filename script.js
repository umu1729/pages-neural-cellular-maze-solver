const svg = d3.select("#svg").append("svg");

const N = 16;
const cellSize = 32;
var size = N*cellSize;
//svg.attr("width",size).attr("height",size);
svg.attr("viewBox","0 0 "+(size)+" "+(size));


var rep = [];

var maze_list = maze_list_ ;
var maze_random_select = ()=>{
  //var sel = Math.floor( Math.random () * maze_list.length);
  var sel = 7;
  //console.log( ["Sel=",sel] );
  return maze_list[sel];
}
var maz = maze_random_select();

var cv1w = new Float32Array(cv1w_);
var cv1b = new Float32Array(cv1b_);
var cv2w = new Float32Array(cv2w_);
var cv2b = new Float32Array(cv2b_);

var pos = [];
var buf = [];
var bid = 0;
for (let x=0;x<N;x++){
  for (let y=0;y<N;y++){
    pos.push( [x,y,bid] );
    var v = Math.random() * 2. -1.;
    buf.push( v );
    bid += 1;
  }
}

//copy maze
for (let i=0;i<N*N;i++) buf[i]=maz[i];

var state = new Float32Array(N*N*16);
var state2 = new Float32Array(N*N*16);
var hidden = new Float32Array(64);
for (let i=0;i<N*N*16;i++) state[i]=0.;
for (let i=0;i<N*N;i++) state[i*16+0]=buf[i];

var bdf = function(v_){
  var v = v_;
  if (v<0) v+=N;
  if (v>=N) v-=N;
  return v;
}

var develop = function(){
  for (let y=0;y<N;y++){
    for (let x=0;x<N;x++){
      for (let co=0;co<64;co++){
        var v = cv1b[co];
        for (let ci=0;ci<16;ci++){
          for (let h=0;h<3;h++){
            for (let w=0;w<3;w++){
              v += cv1w[co*16*3*3+ci*3*3+h*3+w] * state[bdf(x+h-1)*N*16+bdf(y+w-1)*16+ci];
            }
          }
        }
        if (v<0) {v=0.;}
        hidden[co] = v;
      }
      for (let co=0;co<16;co++){
        var v = cv2b[co];
        for (let ci=0;ci<64;ci++){
          v += cv2w[co*64+ci] * hidden[ci];
        }
        state2[x*N*16+y*16+co] = v;
      }
    }
  }
  for (let i=0;i<N*N*16;i++){
    if ( (i%16)==0 ) continue;
    if ( Math.random()<.5 ) continue;
    state[i] += state2[i];
  }
}



var getColorByValue = function(_v){
    var v = Math.min(Math.max(_v, -1), 1);
    return d3.interpolateViridis( v*.5 +.5 );
}
var clamp1 = function(_v){
  return Math.min(Math.max(_v, 0), 1);
}

var rects = svg.selectAll("rect").data(pos).enter().append("rect")
    .attr("x",v=>v[1]*cellSize)
    .attr("y",v=>v[0]*cellSize)
    .attr("width",cellSize-1)
    .attr("height",cellSize-1)
    .attr("fill", (d)=>{
      return getColorByValue(buf[d[2]]);
    })
    .attr("stroke","gray");

var circle_draw_flag = true;
var circles = svg.selectAll("circle").data(pos).enter().append("circle")
  .attr("cx",v=>(v[1]*cellSize + cellSize/2 ))
  .attr("cy",v=>(v[0]*cellSize + cellSize/2 ))
  .attr("r",v=>1.)
  .attr("fill","orange")
  .attr('pointer-events', 'none');

var binary_draw_flag = false;
var drawAll = function(){
  var visl = parseInt( d3.select("#visual_layer").property("value") );
  if (binary_draw_flag ){
    rects.attr("fill", (d)=>{
      var v = state[d[2]*16+visl];
      if (v>0){v=1;}else{v=-1;}
      return getColorByValue( v );
    });
  }else{
    rects.attr("fill", (d)=>getColorByValue( state[d[2]*16+visl] ) );
  }
  if (circle_draw_flag) {
    circles.attr("r", (d)=> clamp1(state[d[2]*16+1]/2+0.5)*cellSize/2 );
  }else{
    circles.attr("r", (d)=> 0.0 );
  }


  //var svgData = new XMLSerializer().serializeToString(svg.node());
  //rep.push(encodeURIComponent(svgData));
}


var change_type = function(bid){
  var blocktype = d3.select("#blocktype").property("value")
  var v = -1;
  if ( blocktype == "wall" ) v=1.;
  if ( blocktype == "road" ) v=0.;
  if ( blocktype == "endpoint" ) v=-1.;
  state[bid*16+0]=v;
  drawAll();
}

rects.on("mouseover", function(e,d){
  if ( (e.buttons&1) == 1 ){
    var bid = d[2];
    change_type(bid);
  };
  d3.select(this)
    .attr("stroke","red");
})
rects.on("mouseout", function(){
  d3.select(this)
    .attr("stroke","gray");
})

rects.on("mousedown", function(e,d){
    var bid = d[2];
    change_type(bid);
})

d3.select("#editmode").on("change",()=>{
  var flag = d3.select("#editmode").property("checked");
  console.log(flag);
  if (flag){
    setTimeout( eventloop, 1000 );
  }
  drawAll();
});
d3.select("#visual_layer").on("change",()=>{
  drawAll();
})

var eventloop = function(){
    if ( !d3.select("#editmode").property("checked") ) return;
    //for (let i=0;i<N*N;i++) state[i*4+0] = buf[i];
    develop();
    drawAll();
    setTimeout( eventloop, 50 );
}
d3.select("#editmode").attr("checked","checked");
setTimeout( eventloop, 1000 );


/////////// for downloader
d3.select("#download").on( "click", function(){
  var text = get_download_text(svg);
  console.log(text);
  d3.select("#div_download")
  .append("div")
  .html("<a href='" + text + "'>download</a>");
});
d3.select("#reset").on( "click", function(){
  rep = [];
  for (let i=0;i<N*N;i++) for (let c=1;c<16;c++) state[i*16+c]=0.;
  drawAll();
});
d3.select("#nextstep").on( "click", function(){
  develop();
  drawAll();
});
d3.select("#toggle_circles").on( "click", function(){
  circle_draw_flag = !circle_draw_flag;
  drawAll();
});
d3.select("#toggle_binary").on( "click", function(){
  binary_draw_flag = !binary_draw_flag;
  drawAll();
});
function download(dataurl, filename) {
  var a = document.createElement("a");
  a.href = dataurl;
  a.setAttribute("download", filename);
  a.click();
}
d3.select("#rep_download").on( "click", function(){
  download("data:text/html,"+rep.join("\n"), "helloWorld.txt");
});
d3.select("#random_reload").on( "click", function(){
  maz = maze_random_select();
  for (let i=0;i<N*N;i++) state[i*16+0]= maz[i];
  drawAll();
});
