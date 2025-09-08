import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth /
        window.innerHeight, 0.1, 1000);

camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const css_renderer = new CSS3DRenderer();
css_renderer.setSize(window.innerWidth, window.innerHeight);
const css_scene = new THREE.Scene();

css_renderer.domElement.style.position = 'absolute';
css_renderer.domElement.style.top = '0px';
css_renderer.domElement.style.pointerEvents = 'none';

const controls = new OrbitControls(camera, renderer.domElement);

document.body.appendChild(renderer.domElement);
document.body.appendChild(css_renderer.domElement);

//GCUBE
const geometry = new THREE.BoxGeometry(2, 2, 2);
const stand_material = new THREE.MeshStandardMaterial();
const cube = new THREE.Mesh(geometry, stand_material);
scene.add(cube);


//Iframe gen
const iframe_transforms = [
        { pos: new THREE.Vector3(0, 0, 1), rot: new THREE.Euler(0, 0, 0) }, //front
        { pos: new THREE.Vector3(0, 0, -1), rot: new THREE.Euler(0, Math.PI, 0) }, //back
        { pos: new THREE.Vector3(1, 0, 0), rot: new THREE.Euler(0, Math.PI / 2, 0) }, //right
        { pos: new THREE.Vector3(-1, 0, 0), rot: new THREE.Euler(0, -Math.PI / 2, 0) }, //left
        { pos: new THREE.Vector3(0, 1, 0), rot: new THREE.Euler(-Math.PI / 2, 0, 0) }, //top
        { pos: new THREE.Vector3(0, -1, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0) }, //bottom
];
function gen_iframes() {
        let frames = [];
        for (let i = 0; i < iframe_transforms.length; i++) {
                const new_el = document.createElement('iframe');
                new_el.src = 'https://cam-ball42.github.io/tetriz/';
                new_el.style.width = '400px';
                new_el.style.height = '400px';
                new_el.style.border = 'none';
                new_el.loading = 'lazy';
                new_el.align = 'left';

                const obj = new CSS3DObject(new_el);
                obj.position.copy(iframe_transforms[i].pos);
                obj.rotation.copy(iframe_transforms[i].rot);
                obj.scale.setScalar(0.005);


                css_scene.add(obj);
                frames.push(obj);

        }
        return frames;
}

let frames = gen_iframes();


//LIGHTS

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const spotlight = new THREE.DirectionalLight(0xffffff);
spotlight.position.set(0, 1000, 0);
spotlight.intensity = 0.8;

scene.add(spotlight);



function animate() {
        // cube.rotation.x += 0.005;
        // cube.rotation.y += 0.005;
        //
        // css_object.rotation.x += 0.005;
        // css_object.rotation.y += 0.005;
        //

        renderer.render(scene, camera);
        css_renderer.render(css_scene, camera);
}

renderer.setAnimationLoop(animate);
