"use client";

import { useEffect, useState, useRef } from "react";
import {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Mouse,
  MouseConstraint,
  Events,
  Common,
  Svg,
  Body,
  Collision
} from "matter-js";

import "pathseg";
import svgPaths from "./svgpaths.json";

export default function MatterHeader() {
  const word = "wordstacker";
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
  });

  const colors = [
    "#f1f6f9",
    "#c89933",
    "#6b9080",
    "#8c86aa",
  ]

  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);

  const bodiesRef = useRef([]);

  var decomp = require("poly-decomp");



  const makeBody = (svgPath, x, y) => {
    // create svg element given our path and the w3 api
    const pathEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathEl.setAttribute("d", svgPath);
    const vertices = Svg.pathToVertices(pathEl, 1); //convert path with given precision

    //create body. should use poly-decomp and pathseg!
    const svgBody = Bodies.fromVertices(
      x,
      y,
      vertices,
      {
        collisionFilter: {
          category: 0x0001 // Will be selectable by mouse
        }
      },
      true
    );

    if (svgBody.parts && svgBody.parts.length > 1) {
      // skip index 0 as it's the parent body
      for (let i = 1; i < svgBody.parts.length; i++) {
        svgBody.parts[i].render.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        svgBody.parts[i].render.strokeStyle = 'black';
        svgBody.parts[i].render.lineWidth = 2;
      }
    }

    const sceneDimensions = getSceneDimensions();
    //make it bigger!
    Body.scale(
      svgBody,
      sceneDimensions.height * 0.0055,
      sceneDimensions.height * 0.0055
    );
    return svgBody;
  };

  // handle the actual rendering setup
  useEffect(() => {
    // Very important, we need this to use decomp
    Common.setDecomp(decomp);
    if (!sceneRef.current) return;

    const engine = Engine.create({
      gravity: { x: 0, y: 1 },
    });

    engineRef.current = engine;
    const sceneDimensions = getSceneDimensions();

    // Our renderer. renders inside sceneRef.current.
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneDimensions.width,
        height: sceneDimensions.height,
        wireframes: false,
        background: "transparent",
      },
    });

    renderRef.current = render;

    // Method that returns an array of boundary walls
    const createWalls = () => {
      const { width, height } = render.options;
      const wallThickness = 30;
      const wallOptions = { isStatic: true, render: { visible: false },  
      collisionFilter: {
        group: -1,  // Negative group means walls won't be selected by mouse
        category: 0x0002,
        mask: 0x0001
      }  };

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

    // Method that returns an array of bodies
    const createBodies = () => {
      const sceneDimensions = getSceneDimensions();
      const { width, height } = sceneDimensions;
      const margin = width * 0.05;
      const gapWidth = width / word.length;

      return word
        .toLowerCase()
        .split("")
        .map((letter, index) => {
          return makeBody(
            svgPaths[letter],
            index * gapWidth + margin,
            height / 2
          );
        });
    };

    // Add walls and bodies to world.
    const bodies = createBodies();
    bodiesRef.current = bodies;
    const walls = createWalls();
    Composite.add(engine.world, [...walls, ...bodiesRef.current]);

    // Create a mouse and mouse constraint.
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
      collisionFilter: {
        mask: 0x0001 // Only select bodies with category 0x0001
      }
    });



    
    Composite.add(engine.world, mouseConstraint);
    Render.run(render);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [dimensions]); // re-create the scene when dimensions change

  // this effect handles window resizing
  useEffect(() => {
    // Update dimensions only on client-side
    if (typeof window === "undefined") return;

    // Update dimensions on mount
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update dimensions on resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getSceneDimensions = () => {
    return {
      width: dimensions.width * 0.5,
      height: dimensions.height * 0.1,
    };
  };

  const sceneDimensions = getSceneDimensions();

  return (
    <div className="">
      <div
        ref={sceneRef}
        style={{
          width: `${sceneDimensions.width}px`,
          height: `${sceneDimensions.height}px`,
          position: "relative",
        }}
        className="absolute inset-0 overflow-hidden"
      />
    </div>
  );
}