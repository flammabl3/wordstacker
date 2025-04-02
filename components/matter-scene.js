"use client";

import { useEffect, useState, useRef } from "react";
import * as Matter from "matter-js";
import "pathseg";
import svgPaths from "./svgpaths.json";

export default function MatterScene() {
  const sceneRef = useRef();
  const engineRef = useRef(null);
  const [highestBody, setHighestBody] = useState(-1);
  const bodiesRef = useRef([]);

  var decomp = require("poly-decomp");

  const findHighest = () => {
    if (!engineRef.current || bodiesRef.current.length === 0) return;

    const bodies = bodiesRef.current;
    bodies.forEach((body) => {
      body.render.fillStyle = "white";
      body.render.fillStyle = "white";
    });
    const highestBody = bodies.reduce((highest, body) => {
      return body.position.y < highest.position.y ? body : highest;
    }, bodies[0]);

    console.log("Highest Body:", highestBody.position.y);
    highestBody.render.fillStyle = "red";
    highestBody.render.strokeStyle = "red";
    console.log(highestBody);
    setHighestBody(highestBody.position.y);
  };

  const makeBody = (svgPath, x, y) => {
    // create svg element given our path and the w3 api
    const pathEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathEl.setAttribute("d", svgPath);
    const vertices = Matter.Svg.pathToVertices(pathEl, 1); //convert path with given precision

    //const { width, height } = 100;

    //console.log(vertices);

    //create body. should use poly-decomp and pathseg!
    const svgBody = Matter.Bodies.fromVertices(
      x,
      y,
      vertices,
      {
        render: {
          fillStyle: "white",
          strokeStyle: "white",
          lineWidth: 2,
        },
      },
      true
    );

    //console.log(svgBody);
    //make it bigger!
    Matter.Body.scale(svgBody, 3, 3);
    return svgBody;
  };

  useEffect(() => {
    //very important, we need this to use decomp
    Matter.Common.setDecomp(decomp);
    if (!sceneRef.current) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
    } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1 },
    });

    engineRef.current = engine;

    // Our renderer. renders inside sceneRef.current.
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: sceneRef.current.clientHeight,
        wireframes: false,
        background: "transparent",
      },
    });

    // method that returns an array of boundary walls
    const createWalls = () => {
      const { width, height } = render.options;
      const wallThickness = 30;
      const wallOptions = { isStatic: true, render: { visible: false } };

      return [
        // bottom
        Bodies.rectangle(width / 2, height, width, wallThickness, wallOptions),
        // left
        Bodies.rectangle(0, height / 2, wallThickness, height, wallOptions),
        // right
        Bodies.rectangle(width, height / 2, wallThickness, height, wallOptions),
        // top
        Bodies.rectangle(width / 2, 0, width, wallThickness, wallOptions),
      ];
    };

    // method that returns an array of bodies
    const createBodies = () => {
      const { width, height } = render.options;
      return [
        makeBody(svgPaths["s"], 10, 100),
        makeBody(svgPaths["h"], 60, 100),
        makeBody(svgPaths["i"], 110, 100),
        makeBody(svgPaths["t"], 160, 100),
      ];
    };

    // add walls and bodies to world.
    const bodies = createBodies();
    bodiesRef.current = bodies;
    Composite.add(engine.world, [...createWalls(), ...bodiesRef.current]);

    // create a mouse and mouse constraint.
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    // method to prevent an event. use when wheel or domscroll occurs.
    // passive : false indicates that the method may call event.preventDefault()
    const preventScroll = (event) => event.preventDefault();
    render.canvas.addEventListener("wheel", preventScroll, { passive: false });
    render.canvas.addEventListener("DOMMouseScroll", preventScroll, {
      passive: false,
    });

    const rotateBody = (event) => {
      // keys e and q, respectively.
      if (event.keyCode == 101 || event.keyCode == 113) {
        let selectedBody = mouseConstraint.body;
        if (selectedBody) {
          // turn left if we press q and right if we press e.
          selectedBody.angle +=
            event.keyCode == 101
              ? (0.1 * Math.PI) / 360
              : (-0.1 * Math.PI) / 360;
        }
      }
    };
    window.addEventListener("keypress", rotateBody);

    //add mouse
    Composite.add(engine.world, mouseConstraint);
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    // change the width and height of our ref.
    const handleResize = () => {
      if (!render || !sceneRef.current) return;

      const width = sceneRef.current.clientWidth;
      const height = sceneRef.current.clientHeight;

      render.options.width = width;
      render.options.height = height;
      render.canvas.width = width;
      render.canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    // cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      render.canvas.removeEventListener("wheel", preventScroll);
      render.canvas.removeEventListener("DOMMouseScroll", preventScroll);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return (
    <div>
      <div className="">
        <div
          ref={sceneRef}
          className="w-full h-full absolute inset-0 overflow-hidden"
        />
      </div>
      <button className="bg-red-500 z-10 relative" onClick={findHighest}>
        Submit
      </button>
      <p>{highestBody}</p>
    </div>
  );
}
