const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true,
  // dimensions: [2048, 2048]
};

// Your glsl code
const frag = glsl(
  /* glsl */`
  precision highp float;
  // shader lang syntax, needs type info
  // uniform => constant, varying => changeable
  // float / vec2 are types
  // time, vUv are variable names
  uniform float time;
  varying vec2 vUv;
  uniform float aspect;
  uniform float mouseX; // I would prefer to use vec2 or something but I don´t know how an object works
  uniform float mouseY;
  uniform float width;
  uniform float height;

  // lets include a package from glsl-noise
  #pragma glslify: noise = require("glsl-noise/simplex/3d")
  // lets use a more advanced color module
  #pragma glslify: hsl2rgb = require("glsl-hsl2rgb")


  void main () {
    // vec3 color = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0.0, 2.0, 4.0));
    // gl_FragColor = vec4(1.0); // white
    // gl_FragColor = vec4(0.8, 0.3, 0.3, 1.0); // rgba()
    // gl_FragColor = vec4(vec3(vUv.x), 1.0); // using x coordinate to create a gradient
    // vec3 color = vec3(sin(time) + 1.0); // using sin to animate b&w
    vec3 colorA =vec3(0.8, 0.3, 0.3); // 
    vec3 colorB =vec3(0.3, 0.3, 0.8); // 
    // vec3 color = mix(colorA, colorB, vUv.y); // using mix inbuilt to create color gradient
    vec3 color = mix(colorA, colorB, vUv.x + vUv.y * sin(time)); // 3rd value controls direction
    
    // Making the image center responsive //
    vec2 center = vUv - 0.5;
    center.x *= aspect; // to fix x axis aspect ratio 
    // center.y /= aspect; // alt way to use aspect
    float dist = length(center); // some sort of vector math 
    
    // Creating the circle 'clipping'
    // float alpha = step(dist, 0.2); // similar to 'dist > 0.2 ? 0.0 : 0.8'
    // float alpha = smoothstep(dist, 0.1, 0.2); // looks cool
    float n2 = noise(vec3(vUv.xy * 5.0, time * 0.25)); // original
    float alpha = smoothstep(0.3555 + (n2 * 0.00051) , 0.352, dist); 
    
    // mouse values aspect ratio
    float mX = mouseX / width;
    float yInverted = abs(mouseY - height) + .000000001;
    float mY = yInverted/ height;

    // using noise
    // float n = noise(vec3(vUv.xy * 5.0, time)); original
    float n = noise(vec3(center * 3.0, time * 0.5)); // using the aspect, & multiplier to scale

    // using new color module
    float noiseAsColorVal = n * 0.5 + 0.5;
    vec3 colorHsl = hsl2rgb(
      mX + (n * 0.1), // hue. Here we add just a bit of randomness
      mY + (n * 0.0), // saturation
      0.5 + (n * 0.05)// light (brightness)
    );

    // Final output variations //
    // gl_FragColor = vec4(color, dist); // where dist is the alpha value
    // gl_FragColor = vec4(color, alpha); // using color variable
    // gl_FragColor = vec4(vec3(n), alpha); // using noise variable
    gl_FragColor = vec4(colorHsl, alpha); // using color variable
  }
`);
/**
 * Vec explained 
 * vec2 | has an x, y
 * vec3 | has an x, y, z
 * vec4 | has an x, y, z, w
 */
// DOM stuff
const body = document.querySelector("body")
const link = document.createElement('link');
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = "style.css";
  document.head.appendChild(link)
let H = 0;
let S = 0; 
let L = 50;
const hslEl = document.createElement("div");
hslEl.textContent = `HSL(${H},${S}%,${L})`;
hslEl.classList.add("hsl");
body.appendChild(hslEl);


// Can I get mouse info from the dom?
let mouseX, mouseY;
document.documentElement.addEventListener("mousemove", (mouseEvent) => {
  const { clientHeight, clientWidth } = document.documentElement;
  const { x, y } = mouseEvent;
  // console.log('x, y,', x, y,)
  mouseX = x;
  mouseY = y;
  H = Math.floor(x/clientWidth * 360);
  const yInverted = Math.abs(y - clientHeight)
  S = Math.floor(yInverted / clientHeight * 100)
  hslEl.textContent = `HSL(${H},${S}%,${L},)`;
  hslEl.style.top = y + "px"
  hslEl.style.left = x + "px"
})
// Can I get scroll or touch info from the dom for mobile? // didn´t work
document.documentElement.addEventListener('scroll', (touchEvent) => {
  console.log('touchEvent', touchEvent)
}, 
);




// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    // set background color
    clearColor: "white",
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      aspect: ({ width, height }) => width / height, // the deconstructed values come from canvas sketch, like 'time', 'playhead'
      mouseX: () => mouseX || 0,
      mouseY: () => mouseY || 0,
      width: ({width}) => width,
      height: ({height}) => height,
    }
  });
};

canvasSketch(sketch, settings);
