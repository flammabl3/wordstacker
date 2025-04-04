"use client";

import { useEffect, useState, useRef } from "react";
import * as Matter from "matter-js";
import "pathseg";
import svgPaths from "./svgpaths.json";

export default function MatterScene({ word ="bd"}) {
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600
  });

  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);

  const [highestBody, setHighestBody] = useState(-1);
  const [score, setScore] = useState(0);
  const bodiesRef = useRef([]);


  var decomp = require("poly-decomp");


  const findHighest = () => {
    if (!engineRef.current || bodiesRef.current.length === 0) return;

    const bodies = bodiesRef.current;
    bodies.forEach((body) => {
      if (body.parts) {
        // composite body - color all parts
        body.parts.forEach(part => {
          part.render.fillStyle = "white";
          part.render.strokeStyle = "white";
        });
      } else {
        // simple body
        body.render.fillStyle = "white";
        body.render.strokeStyle = "white";
      }
    });


    let highestBody = null;
    let highestPointY = Infinity;

    bodiesRef.current.forEach(body => {
      // if body parts is length 1, don't slice. it's not composite.
      // slice(1) to skip the parent in composite
      const parts = body.parts && body.parts.length > 1 ? body.parts.slice(1) : [body]

      parts.forEach(part => {
        const topY = part.bounds.min.y;
        if (topY < highestPointY) {
          highestPointY = topY;
          highestBody = body;
        }
      });
    });


    if (highestBody) {
      if (highestBody.parts) {
        highestBody.parts.forEach(part => {
          part.render.fillStyle = "red";
          part.render.strokeStyle = "red";
        });
      } else {
        highestBody.render.fillStyle = "red";
        highestBody.render.strokeStyle = "red";
      }

    };


    setHighestBody(highestBody.position.y);    
    getScore(highestBody.position.y);
  };

  const getScore = (currentHighestY = null) => {
    const sceneDimensions = getSceneDimensions();
    const valueToUse = currentHighestY !== null ? currentHighestY : highestBody;
    const calculatedScore = sceneDimensions.height / valueToUse * 100;
    setScore(calculatedScore);
    return calculatedScore;
  }


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

    
    const sceneDimensions = getSceneDimensions();
    //console.log(svgBody);
    //make it bigger!
    Matter.Body.scale(svgBody, sceneDimensions.height * 0.0035, sceneDimensions.height * 0.0035);
    return svgBody;
  };

  // handle the actual rendering setup
  useEffect(() => {
    // Very important, we need this to use decomp
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

    // Method that returns an array of bodies
    const createBodies = () => {

      const sceneDimensions = getSceneDimensions();
      const { width, height } = sceneDimensions;
      const margin = width * 0.05;
      const gapWidth = width / word.length;

      return word.toLowerCase().split('').map((letter, index) => {
        return makeBody(svgPaths[letter], (index) * gapWidth + margin, height / 2);
      });
    };

    // Add walls and bodies to world.
    const bodies = createBodies();
    bodiesRef.current = bodies;
    Composite.add(engine.world, [...createWalls(), ...bodiesRef.current]);

    // Create a mouse and mouse constraint.
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    // Method to prevent an event. use when wheel or domscroll occurs.
    const preventScroll = (event) => event.preventDefault();
    render.canvas.addEventListener("wheel", preventScroll, { passive: false });
    render.canvas.addEventListener("DOMMouseScroll", preventScroll, {
      passive: false,
    });

    const rotateBody = (event) => {
      // Keys e and q, respectively.
      if (event.keyCode == 101 || event.keyCode == 113) {
        let selectedBody = mouseConstraint.body;
        if (selectedBody) {
          // Turn left if we press q and right if we press e.
          selectedBody.angle +=
            event.keyCode == 101
              ? (0.1 * Math.PI) / 360
              : (-0.1 * Math.PI) / 360;
        }
      }
    };
    window.addEventListener("keypress", rotateBody);

    // Add mouse
    Composite.add(engine.world, mouseConstraint);
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    // Cleanup
    return () => {
      window.removeEventListener("keypress", rotateBody);
      render.canvas.removeEventListener("wheel", preventScroll);
      render.canvas.removeEventListener("DOMMouseScroll", preventScroll);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [dimensions]); // re-create the scene when dimensions change

  // this effect handles window resizing
  useEffect(() => {
    // Update dimensions only on client-side
    if (typeof window === 'undefined') return;

    // Update dimensions on mount
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update dimensions on resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getSceneDimensions = () => {
    const controlPanelHeight = dimensions.height * 0.2;
    
    return {
      width: dimensions.width,
      height: dimensions.height - controlPanelHeight
    };
  };

  
  const sceneDimensions = getSceneDimensions();

  return (
    <div>
      <div className="">
        <div
          ref={sceneRef}
          style={{
            width: `${sceneDimensions.width}px`,
            height: `${sceneDimensions.height}px`,
            position: 'relative'
          }}
          className="w-full h-full absolute inset-0 overflow-hidden"
        />
      </div>
      <div>
        <button className="bg-red-500 z-10 relative" onClick={findHighest}>
          Submit
        </button>
        <p>Your Score: {score}</p>

        {sceneDimensions.height <= 400 && 
        <p>This screen may be too short to play optimally.</p>
        }
      </div>
    </div>
  );
}
