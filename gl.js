function initGL() {
	canvas = document.getElementById('canvas');

	var gl = canvas.getContext('webgl');
	var width = window.innerWidth;
	var height = window.innerHeight;

	canvas.width = width;
	canvas.height = height;

	gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.clearColor(0,0,0.6,1);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	gl.enable(gl.SAMPLE_COVERAGE);
	gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
	gl.sampleCoverage(1, false);

	window.addEventListener('resize', function() {
		gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	});

	return gl;
}

function createShaders(gl, type)
{
	var shaderScript = '';
	var shader;

	switch(type) {
		case 'fragment':
			shaderScript = document.querySelector('#shader-fs').textContent;
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		case 'vertex':
			shaderScript = document.querySelector('#shader-vs').textContent;
			shader = gl.createShader(gl.VERTEX_SHADER);
			break;
	}

	gl.shaderSource(shader, shaderScript);
	gl.compileShader(shader);
	console.log(gl.getShaderInfoLog(shader));

	return shader;
}

function initShaders(gl)
{
	var vertexShader = createShaders(gl, 'vertex');
	var fragmentShader = createShaders(gl, 'fragment');

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	console.log(gl.getProgramInfoLog(shaderProgram));
	return shaderProgram;
}

