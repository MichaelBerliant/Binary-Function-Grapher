//Alert message that explains the program
function info(){
  alert("This is a 2 input 1 output function grapher. This program creates a finite plane, and then changes the z-coordinate of each of its points to follow your output expression, which is dependent on the variables x and y. The plane will always be made from 350x350 points, but you can choose how spread out those points are by choosing how large the plane will be. The larger the plane is, the more points that are further away from the origin will be evaluated, but at the cost of point density.");
}
function examples(){
  alert("| Hemisphere approximation: S[50;0;x*x+y*y<2500-j*j] with scope=100 | Hemisphere equation: sqrt(2500-x*x-y*y) with scope=100 | Wavy staircase: round(sin(x)+y) | Colourful field: tan(x+y)**2 with scope=100 | Sierpinski pyramid: ((x+32)^(y+32))-32 with scope=63 | Cone: hypot(x,y) |");
}

//Creating the scene, camera, renderer, and orbit controls
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

//Creating the grids along with x, y, and z labels
var gridHelperxy = new THREE.GridHelper(100, 10, 0xff0000, 0x000000);
var gridHelperxz = new THREE.GridHelper(100, 10, 0xff0000, 0x00eaff);
gridHelperxz.rotation.x = -Math.PI/2;
var gridHelperyz = new THREE.GridHelper(100, 10, 0xff0000, 0xffffff);
gridHelperyz.rotation.z = -Math.PI/2;

var xLabel = createTextLabel("x", "#ffffff");
var yLabel = createTextLabel("y", "#00eaff");
var zLabel = createTextLabel("z", "#000000");

xLabel.position.set(55, 0, 0);
yLabel.position.set(0, 0, -55);
zLabel.position.set(0, 0, 55);

gridHelperxy.add(xLabel);
gridHelperxz.add(zLabel);
gridHelperyz.add(yLabel);

scene.add(gridHelperxy, gridHelperxz, gridHelperyz);

function createTextLabel(text, color) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  canvas.width = 64;
  canvas.height = 64;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "Italic 20px Arial";
  context.fillStyle = color;
  var textWidth = context.measureText(text).width;
  context.fillText(text, canvas.width / 2 - textWidth / 2, canvas.height / 2 + 10);

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  var sprite = new THREE.Sprite(material);
  sprite.scale.set(5, 5, 1);

  return sprite;
}

//Creation of the plane geometry
var geometry = new THREE.PlaneBufferGeometry(10,10,350,350);

//Getting the output expression after the enter key is pressed in its textarea
const functionInput = document.getElementById('function-input');
functionInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    updateMaterial();
    updatePosition();
  }
});

function replaceMathFunctions(expression) {
  //Appending Math. to all javascript math objects
  const mathFunctions = ['E','PI','abs','acos','acosh','asin','asinh','atan','atan2', 'atanh','cbrt','ceil','clz32', 'cos','cosh', 'exp','expm1', 'floor','fround','hypot','imul','log','log10', 'log1p', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign','sin', 'sinh','sqrt', 'tan','tanh', 'trunc'];

  for (const func of mathFunctions) {
    const regex = new RegExp(`\\b${func}\\b`, 'g');
    expression = expression.replace(regex, `Math.${func}`);
  }

  //Translates the sigma function into a form that is readable to javascript
  function replaceNestedS(input) {
    const regex = /S\s*\[\s*(\d+)\s*;\s*(\d+)\s*;\s*([^;\]]*?)\s*\]/g;
    const modifiedString = input.replace(regex, (_, a, b, c) => {
      if (c.includes('S')) {
        c = replaceNestedS(c);
      }
      let result = '(';
      for (let i = 0; i < a; i++) {
        const d = c.replace(/j/g, String(Number(b) + i));

        result += '(' + d + ')' + (i < a - 1 ? ' + ' : '');
      }
      result += ')';
      return result;
    });
    return modifiedString;
  }
  //Since it replaces the sigma functions by innermost order, it runs through until each layer is replaced
  while(expression.includes('S')){
    expression = replaceNestedS(expression);
  }

  return expression;
}

//Calculating the light direction that will make the graph the brightest, which is the one that is underneath the graph the least
function lightDirection() {
  const functionStr = replaceMathFunctions(functionInput.value);
  const positionFunc = new Function('x', 'y', `return ${functionStr};`);

  const solutions = [0,0,0,0]
  const step = 0.01;

  for (let i = 0; i < 1000; i++) {
    if (positionFunc((-5 + i * step), (-5 + i * step)) >= ((-5 + i * step)+(-5 + i * step))/2) {
      if((-5 + i * step) >= 0){ solutions[0]++;}
    }
    if (positionFunc((-5 + i * step), (-5 + i * step)) >= -((-5 + i * step)+(-5 + i * step))/2) {
      if((-5 + i * step) <= 0){ solutions[1]++;}
    }
    if (positionFunc((-5 + i * step), (5 - i * step)) >= ((-5 + i * step)-(5 - i * step))/2) {
      if((5 - i * step) >= 0){ solutions[2]++;}
    }
    if (positionFunc((-5 + i * step), (5 - i * step)) >= (-(-5 + i * step)+(5 - i * step))/2) {
      if((5 - i * step) <= 0){ solutions[3]++;}
    }
  }
  if(solutions.indexOf(Math.min.apply(null,solutions)) == 0){ return [1,1,1];}
  if(solutions.indexOf(Math.min.apply(null,solutions)) == 1){ return [-1,-1,1];}
  if(solutions.indexOf(Math.min.apply(null,solutions)) == 2){ return [-1,1,1];}
  if(solutions.indexOf(Math.min.apply(null,solutions)) == 3){ return [1,-1,1];}
}

//Creating a custom material that colours each point based on its slope and shades each point based on the calculation of three different lights
const material = new THREE.ShaderMaterial({
  uniforms: {
      light: { type: 'vec3', value: new THREE.Vector3(...lightDirection()) },
      color1: {type: 'vec3', value: new THREE.Color(0xff0000)},
      color2: {type: 'vec3', value: new THREE.Color(0xff6600)},
      color3: {type: 'vec3', value: new THREE.Color(0xffff00)},
      color4: {type: 'vec3', value: new THREE.Color(0x00ff00)},
      color5: {type: 'vec3', value: new THREE.Color(0x00ffff)},
      color6: {type: 'vec3', value: new THREE.Color(0x0026ff)}
  },
  side: THREE.DoubleSide,
  vertexShader:  `
    varying vec3 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = position;
      vNormal = normal;

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform vec3 color4;
  uniform vec3 color5;
  uniform vec3 color6;
  uniform vec3 light;
  varying vec3 vUv;
  varying vec3 vNormal;

  void main() {
      vec3 light1 = normalize(light);

      vec3 ambient = vec3(0.5, 0.5, 0.5);
      vec3 diffuse = vec3(0.7, 0.7, 0.7);
      vec3 specular = vec3(0.5, 0.5, 0.5);

      float shininess = 32.0;

      vec3 surfaceColor = vec3(0.0);
      float slope = length(vNormal.xy);
      if(slope < 0.2){
          surfaceColor = mix(color1, color2, slope*5.0);
      } else if(slope < 0.4){
          surfaceColor = mix(color2, color3, (slope-0.2)*5.0);
      } else if(slope < 0.6){
          surfaceColor = mix(color3, color4, (slope-0.4)*5.0);
      } else if(slope < 0.8){
          surfaceColor = mix(color4, color5, (slope-0.6)*5.0);
      } else if(slope < 1.0){
          surfaceColor = mix(color5, color6, (slope-0.8)*5.0);
      } else {
          surfaceColor = color6;
      }

      vec3 ambientColor = ambient * surfaceColor;
      vec3 diffuseColor1 = diffuse * surfaceColor * max(dot(vNormal, light1), 0.0);
      vec3 reflectDir1 = reflect(-light1, vNormal);
      vec3 viewDir1 = normalize(-vNormal);
      vec3 specularColor1 = specular * pow(max(dot(viewDir1, reflectDir1), 0.0), shininess);

      gl_FragColor = vec4(ambientColor + diffuseColor1 + specularColor1, 1.0);
  }
  `
});

//Allows for the material to make calculations with the vector returned by lightDirection()
function updateMaterial() {
  const lightDir = lightDirection();
  material.uniforms.light.value.set(lightDir[0], lightDir[1], lightDir[2]);
}
functionInput.addEventListener('change', updateMaterial);
updateMaterial();

//Creation of the horizontal plane mesh
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI/2
scene.add(plane);

//Getting the size of the plane after the enter key is pressed in its textarea
const scope = document.getElementById('scope');
scope.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    updateScope();
  }
});

//Changes the plane geometry to have the height and width of size scope
function updateScope() {
  if (scope.value > 0) {
    geometry.dispose();
    const newGeometry = new THREE.PlaneBufferGeometry(scope.value, scope.value, 350, 350);
    plane.geometry = newGeometry;
    geometry = newGeometry;
  }
}

//Changing the z-coordinate of each point in the plane mesh to follow the output expression and adjusting their normal vectors to match the new shape of the plane mesh. This needs to be rendered contantly so that the graph can be moved around and seen from different sides.
function updatePosition() {
  const functionStr = replaceMathFunctions(functionInput.value);
  const positionFunc = new Function('x', 'y', `return ${functionStr};`);

  function render() {
    for(let i = 0; i < geometry.attributes.position.count; i++){
      const x = geometry.attributes.position.getX(i);
      const y = geometry.attributes.position.getY(i);
      const z = positionFunc(x, y);

      geometry.attributes.position.setZ(i, z)
    }
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  render();
}
