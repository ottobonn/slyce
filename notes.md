* slyce
  * slyce converts 3D models into sets of 2D drawings for fabrication
  * The input is a 3D model. Currently it must be in OBJ format
  * The output is a collection of drawings. These drawings will likely be SVG or DXF.

* The combined slicer geometry is nice for quick rendering of the preview, but I need a way to isolate each slice to make its drawing.
* Using CSG to perform the intersections results in 3D slice models
