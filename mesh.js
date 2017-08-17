function load_mesh_data(string) {
  var lines = string.split("\n");
  var positions = [];
  var normals = [];
  var vertices = [];

  for ( var i = 0 ; i < lines.length ; i++ ) {
    var parts = lines[i].trimRight().split(' ');
    if ( parts.length > 0 ) {
      switch(parts[0]) {
        case 'v':  positions.push(
          vec3.fromValues(
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          ));
          break;
        case 'vn':
          normals.push(
            vec3.fromValues(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
          ));
          break;
        case 'f': {
          var f1 = parts[1].split('/');
          var f2 = parts[2].split('/');
          var f3 = parts[3].split('/');
          Array.prototype.push.apply(
            vertices, positions[parseInt(f1[0]) - 1]
          );
          Array.prototype.push.apply(
            vertices, normals[parseInt(f1[2]) - 1]
          );
          Array.prototype.push.apply(
            vertices, positions[parseInt(f2[0]) - 1]
          );
          Array.prototype.push.apply(
            vertices, normals[parseInt(f2[2]) - 1]
          );
          Array.prototype.push.apply(
            vertices, positions[parseInt(f3[0]) - 1]
          );
          Array.prototype.push.apply(
            vertices, normals[parseInt(f3[2]) - 1]
          );
          break;
        }
      }
    }
  }
  var vertexCount = vertices.length / 6;
  return {
    primitiveType: 'TRIANGLES',
    vertices: new Float32Array(vertices),
    vertexCount: vertexCount
  };
}
