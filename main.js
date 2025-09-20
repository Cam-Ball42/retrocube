import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import * as snake from './snake.js';
import * as asteroids from './asteroids.js'
import * as breakout from './breakout.js'

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


//MYCUBE
let cube_obj;
const mtl_loader = new MTLLoader();
const obj_loader = new OBJLoader();

mtl_loader.load(
        `./cube.mtl`,
        function (materials) {
                materials.preload();
                obj_loader.setMaterials(materials);
                obj_loader.load(
                        './cube.obj',
                        function (object) {

                                object.scale.set(1.11, 1.11, 1.11);
                                cube_obj = object;
                                scene.add(object);

                        },
                        function (xhr) {
                                console.log((xhr.loaded / xhr.total * 100) + `% loaded`);
                        },
                        function (error) {
                                console.log(`An error occured: ${error}`);
                        },
                )



        },
        function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + `% loaded`);
        },
        function (error) {
                console.log(`An error occured: ${error}`);
        },
)




const games = [snake, asteroids, breakout];

//Iframe gen
const canvas_transforms = [
        //front
        { pos: new THREE.Vector3(0, 0, 1), rot: new THREE.Euler(0, 0, 0) },
        //back
        { pos: new THREE.Vector3(0, 0, -1), rot: new THREE.Euler(0, Math.PI, 0) },
        //right
        { pos: new THREE.Vector3(1, 0, 0), rot: new THREE.Euler(0, Math.PI / 2, 0) },
        //left
        { pos: new THREE.Vector3(-1, 0, 0), rot: new THREE.Euler(0, -Math.PI / 2, 0) },
        //top
        { pos: new THREE.Vector3(0, 1, 0), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
        //bottom
        { pos: new THREE.Vector3(0, -1, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0) },
];
function gen_canvas() {
        let frames = [];
        for (let i = 0; i < canvas_transforms.length; i++) {

                var canvas;
                if (i === 0) {
                        canvas = snake.get_canvas();
                        snake.set_canvas_transform(canvas_transforms[i]);
                }
                else if (i === 1) {
                        canvas = asteroids.get_canvas();
                        asteroids.set_canvas_transform(canvas_transforms[i]);

                }
                else if (i == 2) {
                        canvas = breakout.get_canvas();
                        breakout.set_canvas_transform(canvas_transforms[i]);
                }
                else { continue }
                var obj = new CSS3DObject(canvas);
                obj.position.copy(canvas_transforms[i].pos);
                obj.rotation.copy(canvas_transforms[i].rot);
                obj.scale.setScalar(0.005);
                css_scene.add(obj);


        }
        return frames;
}

let frames = gen_canvas();


//LIGHTS

const light = new THREE.AmbientLight(0x404040);
light.intensity = 1;
scene.add(light);

const spotlight = new THREE.DirectionalLight(0x404040, 0.1);
spotlight.position.set(0, 0, 0);
spotlight.castShadow = true;
camera.add(spotlight);
scene.add(camera);

const top_light = new THREE.DirectionalLight(0x404040, 0.8);
top_light.position.set(0, 20, 0);
scene.add(top_light)

// scene.add(spotlight);

scene.background = new THREE.Color(0.1, 0.1, 0.1);

//RESIZE HANDLER
//
function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update camera
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Update both renderers
        renderer.setSize(width, height);
        css_renderer.setSize(width, height);
}
window.addEventListener('resize', onWindowResize);
window.addEventListener('mousemove', handleFaceProcess)

function handleFaceProcess() {

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        var visibleFaces = [];
        for (let i = 0; i < games.length; i++) {
                const dot = cameraDirection.dot(games[i].get_canvas_transform().pos)
                if (dot < -0.5) {
                        games[i].start_game();
                }
                else { games[i].pause_game(); }
        }

}

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
