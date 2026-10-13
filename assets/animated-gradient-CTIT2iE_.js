import{i as e,r as t,t as n}from"./index-B9qneiih.js";import{t as r}from"./utils-ClgBrqTa.js";var i=e(t(),1),a=n(),o=class extends i.Component{state={hasError:!1};static getDerivedStateFromError(){return{hasError:!0}}componentDidCatch(e,t){this.props.onError?.(e,t)}render(){return this.state.hasError?this.props.fallback??(0,a.jsx)(s,{}):this.props.children}};function s({className:e,message:t=`Interactive WebGL content is unavailable on this device/browser.`}){return(0,a.jsx)(`div`,{className:r(`h-full w-full bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_58%,#ca8a04_140%)]`,e),role:`status`,"aria-live":`polite`,children:(0,a.jsx)(`span`,{className:`sr-only`,children:t})})}var c={Checks:0,Stripes:1,Edge:2},l={Aurora:{color1:`#0a001a`,color2:`#1a0b2e`,color3:`#f20089`,rotation:-45,proportion:60,scale:.6,speed:15,distortion:40,swirl:80,swirlIterations:10,softness:100,offset:200,shape:`Edge`,shapeSize:50},Oceanic:{color1:`#000814`,color2:`#001d3d`,color3:`#00b4d8`,rotation:0,proportion:70,scale:.4,speed:10,distortion:15,swirl:50,swirlIterations:12,softness:80,offset:150,shape:`Checks`,shapeSize:30},Amber:{color1:`#140c00`,color2:`#4a2500`,color3:`#f57c00`,rotation:120,proportion:80,scale:.8,speed:20,distortion:25,swirl:60,swirlIterations:8,softness:90,offset:500,shape:`Stripes`,shapeSize:40},Toxic:{color1:`#050d05`,color2:`#0a240a`,color3:`#39ff14`,rotation:-90,proportion:55,scale:.5,speed:25,distortion:60,swirl:100,swirlIterations:15,softness:70,offset:-100,shape:`Edge`,shapeSize:20},Ghost:{color1:`#0a0a0a`,color2:`#1c1c1c`,color3:`#a3a3a3`,rotation:45,proportion:50,scale:.3,speed:8,distortion:10,swirl:30,swirlIterations:5,softness:100,offset:0,shape:`Checks`,shapeSize:60}};function u(e){let t=window.devicePixelRatio||1;return Math.min(t,e<768?1:1.5)}function d({config:e={preset:`Aurora`},noise:t,radius:n=`0px`,style:d,className:p}){let h=(0,i.useRef)(null),g=(0,i.useRef)(null),_=(0,i.useRef)(void 0),v=(0,i.useRef)(0),y=(0,i.useRef)(0),b=(0,i.useRef)(null),[x,S]=(0,i.useState)(!1),[C,w]=(0,i.useState)(!1);(0,i.useEffect)(()=>(S(!0),()=>S(!1)),[]);let T=(0,i.useMemo)(()=>{if(e.preset===`custom`)return{color1:e.color1,color2:e.color2,color3:e.color3,rotation:e.rotation??0,proportion:e.proportion??35,scale:e.scale??1,speed:e.speed??25,distortion:e.distortion??12,swirl:e.swirl??80,swirlIterations:e.swirlIterations??10,softness:e.softness??100,offset:e.offset??0,shape:e.shape??`Checks`,shapeSize:e.shapeSize??10};let t=l[e.preset]||l.Aurora;return{...t,speed:e.speed??t.speed}},[e]);return(0,i.useEffect)(()=>{if(C)return;let e=h.current,t=g.current;if(!(!e||!t||!x))try{let n=e.getContext(`webgl2`,{premultipliedAlpha:!0,alpha:!0,antialias:!1});if(!n){console.info(`[hero-gradient] webgl-init`,{success:!1,reason:`webgl2-unavailable`,canvasMounted:!0}),w(!0);return}console.info(`[hero-gradient] webgl-init`,{success:!0,context:`webgl2`,canvasMounted:!0,prefersReducedMotion:typeof window.matchMedia==`function`?window.matchMedia(`(prefers-reduced-motion: reduce)`).matches:null});let r=n.createShader(n.VERTEX_SHADER);if(n.shaderSource(r,`#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`),n.compileShader(r),!n.getShaderParameter(r,n.COMPILE_STATUS)){n.deleteShader(r),w(!0);return}let i=n.createShader(n.FRAGMENT_SHADER);if(n.shaderSource(i,m),n.compileShader(i),!n.getShaderParameter(i,n.COMPILE_STATUS)){n.deleteShader(r),n.deleteShader(i),w(!0);return}let a=n.createProgram();if(n.attachShader(a,r),n.attachShader(a,i),n.linkProgram(a),!n.getProgramParameter(a,n.LINK_STATUS)){n.deleteProgram(a),n.deleteShader(r),n.deleteShader(i),w(!0);return}n.useProgram(a);let o=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,o),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),n.STATIC_DRAW);let s=n.getAttribLocation(a,`a_position`);n.enableVertexAttribArray(s),n.vertexAttribPointer(s,2,n.FLOAT,!1,0,0);let l={u_time:n.getUniformLocation(a,`u_time`),u_resolution:n.getUniformLocation(a,`u_resolution`),u_pixelRatio:n.getUniformLocation(a,`u_pixelRatio`),u_scale:n.getUniformLocation(a,`u_scale`),u_rotation:n.getUniformLocation(a,`u_rotation`),u_color1:n.getUniformLocation(a,`u_color1`),u_color2:n.getUniformLocation(a,`u_color2`),u_color3:n.getUniformLocation(a,`u_color3`),u_proportion:n.getUniformLocation(a,`u_proportion`),u_softness:n.getUniformLocation(a,`u_softness`),u_shape:n.getUniformLocation(a,`u_shape`),u_shapeScale:n.getUniformLocation(a,`u_shapeScale`),u_distortion:n.getUniformLocation(a,`u_distortion`),u_swirl:n.getUniformLocation(a,`u_swirl`),u_swirlIterations:n.getUniformLocation(a,`u_swirlIterations`)},d=!0,p=document.visibilityState===`visible`,h=0,g=()=>d&&p,x=r=>{if(!g()){_.current=void 0;return}let i=(r-v.current-y.current)/1e3,a=T.speed/100*5,o=u(t.clientWidth),s=i*a+T.offset*.01;h<3&&(console.info(`[hero-gradient] frame`,{timeUniform:s,inView:d,pageVisible:p,canvas:{width:e.width,height:e.height}}),h+=1),n.uniform1f(l.u_time,s),n.uniform2f(l.u_resolution,e.width,e.height),n.uniform1f(l.u_pixelRatio,o),n.uniform1f(l.u_scale,T.scale),n.uniform1f(l.u_rotation,T.rotation*Math.PI/180);let m=f(T.color1),b=f(T.color2),S=f(T.color3);n.uniform4f(l.u_color1,m[0],m[1],m[2],m[3]),n.uniform4f(l.u_color2,b[0],b[1],b[2],b[3]),n.uniform4f(l.u_color3,S[0],S[1],S[2],S[3]),n.uniform1f(l.u_proportion,T.proportion/100),n.uniform1f(l.u_softness,T.softness/100),n.uniform1f(l.u_shape,c[T.shape]),n.uniform1f(l.u_shapeScale,T.shapeSize/100),n.uniform1f(l.u_distortion,T.distortion/50),n.uniform1f(l.u_swirl,T.swirl/100),n.uniform1f(l.u_swirlIterations,T.swirl===0?0:T.swirlIterations),n.drawArrays(n.TRIANGLES,0,6),_.current=requestAnimationFrame(x)},S=()=>{let r=t.clientWidth,i=t.clientHeight,a=u(r);e.width=Math.max(1,Math.floor(r*a)),e.height=Math.max(1,Math.floor(i*a)),e.style.width=`${r}px`,e.style.height=`${i}px`,n.viewport(0,0,e.width,e.height),r>0&&i>0&&g()&&_.current===void 0&&(_.current=requestAnimationFrame(x))},C=()=>{b.current===null&&(b.current=performance.now()),_.current!==void 0&&(cancelAnimationFrame(_.current),_.current=void 0)},E=()=>{b.current!==null&&(y.current+=performance.now()-b.current,b.current=null),_.current===void 0&&g()&&(_.current=requestAnimationFrame(x))},D=()=>{g()?E():C()};S();let O=new ResizeObserver(S);O.observe(t),v.current=performance.now(),y.current=0,b.current=null;let k=new IntersectionObserver(([e])=>{let t=e?.boundingClientRect;d=t&&t.width>0&&t.height>0?!!e?.isIntersecting:!0,D()},{threshold:0,rootMargin:`80px`});k.observe(t);let A=()=>{p=document.visibilityState===`visible`,D()};return document.addEventListener(`visibilitychange`,A),D(),()=>{_.current!==void 0&&cancelAnimationFrame(_.current),O.disconnect(),k.disconnect(),document.removeEventListener(`visibilitychange`,A),n.deleteProgram(a),n.deleteShader(r),n.deleteShader(i),n.deleteBuffer(o)}}catch{w(!0);return}},[C,x,T]),C?(0,a.jsx)(s,{className:r(`absolute inset-0 overflow-hidden pointer-events-none`,p)}):(0,a.jsx)(o,{fallback:(0,a.jsx)(s,{className:r(`absolute inset-0 overflow-hidden pointer-events-none`,p)}),children:(0,a.jsxs)(`div`,{ref:g,className:r(`absolute inset-0 overflow-hidden pointer-events-none`,p),style:{borderRadius:n,...d},children:[(0,a.jsx)(`canvas`,{ref:h,style:{display:`block`,width:`100%`,height:`100%`}}),t&&t.opacity>0&&(0,a.jsx)(`div`,{style:{position:`absolute`,inset:0,backgroundImage:`url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMCCgkGBAVJOAVJAAAASklEQVQ4y2NgGAWjYBSMglEwCgY/YGRgZBQUYmJiZGQEkYwMjIyMgoKCjIyMIJKBgRFIMjIyAklGRkYGRkFBYEcwMDIyMjAOUQAA1I4HwVwZAkYAAAAASUVORK5CYII=")`,backgroundSize:(t.scale??1)*200,backgroundRepeat:`repeat`,opacity:t.opacity/2,pointerEvents:`none`}})]})})}function f(e){let t=0,n=0,r=0,i=1;if(e.startsWith(`rgba(`)){let a=e.slice(5,-1).split(`,`);t=parseInt(a[0]??`0`)/255,n=parseInt(a[1]??`0`)/255,r=parseInt(a[2]??`0`)/255,i=parseFloat(a[3]??`1`)}else if(e.startsWith(`rgb(`)){let i=e.slice(4,-1).split(`,`);t=parseInt(i[0]??`0`)/255,n=parseInt(i[1]??`0`)/255,r=parseInt(i[2]??`0`)/255}else if(e.startsWith(`hsla(`)||e.startsWith(`hsl(`)){let a=e.startsWith(`hsla(`),o=e.slice(a?5:4,-1).split(`,`),s=parseFloat(o[0]??`0`)/360,c=parseFloat(o[1]??`0`)/100,l=parseFloat(o[2]??`0`)/100;i=a?parseFloat(o[3]??`1`):1,[t,n,r]=p(s,c,l)}else if(e.startsWith(`#`)){let a=e.slice(1);a.length===3?(t=parseInt(a.charAt(0)+a.charAt(0),16)/255,n=parseInt(a.charAt(1)+a.charAt(1),16)/255,r=parseInt(a.charAt(2)+a.charAt(2),16)/255):a.length>=6&&(t=parseInt(a.slice(0,2),16)/255,n=parseInt(a.slice(2,4),16)/255,r=parseInt(a.slice(4,6),16)/255,a.length===8&&(i=parseInt(a.slice(6,8),16)/255))}return[t,n,r,i]}function p(e,t,n){let r,i,a;if(t===0)r=i=a=n;else{let o=(e,t,n)=>(n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*(2/3-n)*6:e),s=n<.5?n*(1+t):n+t-n*t,c=2*n-s;r=o(c,s,e+1/3),i=o(c,s,e),a=o(c,s,e-1/3)}return[r,i,a]}var m=`#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
    vec3 color1 = c1.rgb * c1.a;
    vec3 color2 = c2.rgb * c2.a;
    vec3 color3 = c3.rgb * c3.a;

    float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
    float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

    vec3 blended_color_2 = mix(color1, color2, r1);
    float blended_opacity_2 = mix(c1.a, c2.a, r1);

    vec3 c = mix(blended_color_2, color3, r2);
    float o = mix(blended_opacity_2, c3.a, r2);
    return vec4(c, o);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float t = .5 * u_time;

    float noise_scale = .0005 + .006 * u_scale;

    uv -= .5;
    uv *= (noise_scale * u_resolution);
    uv = rotate(uv, u_rotation * .5 * PI);
    uv /= u_pixelRatio;
    uv += .5;

    float n1 = noise(uv * 1. + t);
    float n2 = noise(uv * 2. - t);
    float angle = n1 * TWO_PI;
    uv.x += 4. * u_distortion * n2 * cos(angle);
    uv.y += 4. * u_distortion * n2 * sin(angle);

    float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
    for (float i = 1.; i <= iterations_number; i++) {
        uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
        uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
    }

    float proportion = clamp(u_proportion, 0., 1.);

    float shape = 0.;
    float mixer = 0.;
    if (u_shape < .5) {
      vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
      shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else if (u_shape < 1.5) {
      vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
      float f = fract(stripes_shape_uv.y);
      shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else {
      float sh = 1. - uv.y;
      sh -= .5;
      sh /= (noise_scale * u_resolution.y);
      sh += .5;
      float shape_scaling = .2 * (1. - u_shapeScale);
      shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
      mixer = shape;
    }

    vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

    fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;export{d as AnimatedGradient};