var get_download_text = function(svg_){
  var svg = svg_.node();
  var svgData = new XMLSerializer().serializeToString(svg);
  var canvas = document.createElement("canvas");
  canvas.width = svg.width.baseVal.value;
  canvas.height = svg.height.baseVal.value;

  var ctx = canvas.getContext("2d");
  var image = new Image;
  var text = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));
  image.src = text;
  return text;
}
