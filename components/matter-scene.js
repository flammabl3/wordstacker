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

export default function MatterScene({ word = "default" }) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  word = word.substring(0, 9);
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
  });

  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);

  const [highestBody, setHighestBody] = useState(-1);
  const [score, setScore] = useState(0);
  const [isCheckingStability, setIsCheckingStability] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [scoreValid, setScoreValid] = useState(null);
  
  // Use refs to track the stability checking process
  const stabilityCheckRef = useRef({
    isChecking: false,
    initialScore: 0,
    maxDifference: 0,
    startTime: 0,
    endTime: 0
  });

  const bodiesRef = useRef([]);

  var decomp = require("poly-decomp");

  const findHighest = () => {
    if (!engineRef.current || bodiesRef.current.length === 0) return;

    const bodies = bodiesRef.current;

    let highestBody = null;
    let highestPointY = Infinity;

    bodiesRef.current.forEach((body) => {
      // if body parts is length 1, don't slice. it's not composite.
      // slice(1) to skip the parent in composite
      const parts =
        body.parts && body.parts.length > 1 ? body.parts.slice(1) : [body];

      parts.forEach((part) => {
        const topY = part.bounds.min.y;
        if (topY < highestPointY) {
          highestPointY = topY;
          highestBody = body;
        }
      });
    });

    setHighestBody(highestBody.position.y);
    return getScore(highestBody.position.y);
  };

  const getScore = (currentHighestY = null) => {
    const sceneDimensions = getSceneDimensions();
    const valueToUse = currentHighestY !== null ? currentHighestY : highestBody;
    const maxY = sceneDimensions.height * 0.15; // score 100 at 85% of height
    const minY = sceneDimensions.height * 0.9;  // score at 0 at 10% or lower
    
    const clampedY = Math.min(Math.max(valueToUse, maxY), minY); // clamp to avoid going beyond range
    
    const calculatedScore = ((minY - clampedY) / (minY - maxY)) * 100;
    setScore(calculatedScore);
    return calculatedScore;
  };

  const checkScore = () => {
    if (!engineRef.current || isCheckingStability) return;
    
    // Set checking state 
    setIsCheckingStability(true);
    setScoreValid(null);
    
    // Get current score
    const currentScore = findHighest();
    
    // Setup stability check in the ref (accessible from engine events)
    stabilityCheckRef.current = {
      isChecking: true,
      initialScore: currentScore,
      maxDifference: 0,
      startTime: Date.now(),
      endTime: Date.now() + 3000
    };
  };

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
      // Skip index 0 as it's the parent body
      for (let i = 1; i < svgBody.parts.length; i++) {
        svgBody.parts[i].render.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        svgBody.parts[i].render.strokeStyle = 'black';
        svgBody.parts[i].render.lineWidth = 2;
      }
    }

    const sceneDimensions = getSceneDimensions();
    //make it bigger!
    Body.scale(
      svgBody,
      sceneDimensions.height * 0.0035,
      sceneDimensions.height * 0.0035
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

    // Method to prevent an event. use when wheel or domscroll occurs.
    const preventScroll = (event) => event.preventDefault();
    render.canvas.addEventListener("wheel", preventScroll, { passive: false });
    render.canvas.addEventListener("DOMMouseScroll", preventScroll, {
      passive: false,
    });

    let rotating = { left: false, right: false };

    const handleKeyDown = (event) => {
      if (event.key === "q") rotating.left = true;
      if (event.key === "e") rotating.right = true;
    };

    const handleKeyUp = (event) => {
      if (event.key === "q") rotating.left = false;
      if (event.key === "e") rotating.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Add mouse
    Composite.add(engine.world, mouseConstraint);
    Render.run(render);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    
    // Add event for tracking stability using the engine events directly
    Events.on(engine, "afterUpdate", () => {
      const currentScore = findHighest();
      
      // Handle stability checking
      const stabilityCheck = stabilityCheckRef.current;
      
      if (stabilityCheck.isChecking) {
        // Calculate difference from initial score
        const difference = Math.abs(currentScore - stabilityCheck.initialScore);
        
        // Track maximum difference
        if (difference > stabilityCheck.maxDifference) {
          stabilityCheck.maxDifference = difference;
        }
        
        // Check if time is up
        if (Date.now() >= stabilityCheck.endTime) {
          // Stability check is complete
          const isValid = stabilityCheck.maxDifference <= 3;
          
          // Update UI
          setIsCheckingStability(false);
          setScoreValid(isValid);
          if (isValid)
            setFinalScore(currentScore);
          
          // Log results
          console.log(`Initial score: ${stabilityCheck.initialScore.toFixed(1)}`);
          console.log(`Max score difference: ${stabilityCheck.maxDifference.toFixed(1)}, Is valid: ${isValid}`);
          
          // Reset checking state
          stabilityCheck.isChecking = false;
        }
      }
      
      const selectedBody = mouseConstraint.body;
      if (selectedBody) {
        if (rotating.left) {
          selectedBody.torque = -0.1;
        } else if (rotating.right) {
          selectedBody.torque = 0.1;
        } else {
          Body.setStatic(selectedBody, true);
          Body.setStatic(selectedBody, false);
        }
      }

      const sceneHeight = getSceneDimensions().height;
      const sceneWidth = getSceneDimensions().width;
      bodiesRef.current.forEach((body) => {
        if (body.isStatic) return;
        const { x, y } = body.position;
        const paddingX = sceneWidth * 0.01;
        const paddingY = sceneHeight * 0.01;

        // teleport bodies that clip out of bounds
        const outOfBounds =
          y > sceneHeight + paddingY || y < 0 - paddingY || x < 0 - paddingX || x > sceneWidth + paddingX;

        for (let wall of walls) {
          const collision = Collision.collides(body, wall);
          if (
            (collision?.collided && collision.depth > 30) ||
            outOfBounds) {
            
            if (body !== wall && wall.isStatic && mouseConstraint.body !== body) {
              Body.setPosition(body, {
                x: sceneWidth / 2,
                y: sceneHeight / 2,
              });

              Body.setVelocity(body, { x: 0, y: 0 });
              Body.setAngularVelocity(body, 0);
            }
            break;
          }
        }
      });
    });

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    const controlPanelHeight = dimensions.height * 0.2;

    return {
      width: dimensions.width,
      height: dimensions.height - controlPanelHeight,
    };
  };

  const sceneDimensions = getSceneDimensions();

  return (
    <div>
      {sceneDimensions.height > 400 &&
      <div>
        <div className="">
          <div
            ref={sceneRef}
            style={{
              width: `${sceneDimensions.width}px`,
              height: `${sceneDimensions.height}px`,
              position: "relative",
            }}
            className="w-full h-full absolute inset-0 overflow-hidden"
          />
        </div>
        
        <div className="m-4 p-4 bg-charcoal-900 text-anti-flash-white-300 rounded-lg shadow-lg">
          <button 
            className={`${isCheckingStability ? 'bg-satin-sheen-gold-700' : 'bg-cool-grey-700'} text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-cool-grey-800 transition duration-300 shadow-md`} 
            onClick={checkScore} 
            disabled={isCheckingStability}
          >
            {isCheckingStability ? 'Checking stability...' : 'Check Score'}
          </button>
          
          <div className="mt-2">
            <p className="text-anti-flash-white-300">Current Score: {score.toFixed(0)}</p>
            {finalScore &&
            <p className="text-anti-flash-white-300">Highest Score: {finalScore.toFixed(0)}</p>
            }
            
            {scoreValid === true && (
              <p className="text-viridian-300 font-bold mt-2">
                Valid score: {finalScore.toFixed(0)}! Your stack is stable.
              </p>
            )}
            
            {scoreValid === false && (
              <p className="text-satin-sheen-gold-300 font-bold mt-2">
                Invalid score. Your stack is still moving too much.
              </p>
            )}
          </div>
        </div>
      </div>
      }
      {sceneDimensions.height <= 400 && (
      <div>
        <p>This screen may be too short to play optimally.</p>
      </div>
      )}
    </div>
  );
}