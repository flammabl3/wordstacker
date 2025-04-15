"use client";

import { useEffect, useState, useRef, use } from "react";
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
  Collision,
} from "matter-js";

import seedrandom from "seedrandom";

import "pathseg";
import svgPaths from "./svgpaths.json";

import { useRouter } from "next/navigation";

import { addScore, getItems } from "../_services/scores-service";

export default function MatterScene({ word = "default", dailyWord = false }) {
  const hashWordToSeed = (word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0; // convert to 32-bit integer
    }
    return hash.toString(); // convert to string for seedrandom
  };

  const rng = seedrandom(
    dailyWord ? hashWordToSeed(word) : (Math.random() * 10000).toString()
  );

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
  const [submit, setSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const [highscore, setHighscore] = useState();

  const router = useRouter();

  const [playerInfo, setPlayerInfo] = useState({
    name: "",
    score: null,
    word: word,
    wordOfTheDay: dailyWord,
  });

  // Use refs to track the stability checking process
  const stabilityCheckRef = useRef({
    isChecking: false,
    initialScore: 0,
    maxDifference: 0,
    startTime: 0,
    endTime: 0,
  });

  const bodiesRef = useRef([]);

  var decomp = require("poly-decomp");

  useEffect(() => {
    const getHighscore = async () => {
      const date = new Date()
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join(".");
      const scores = await getItems(date);
      const highestScore = scores
        .filter((item) => item.word === word) // include only scores for the current word
        .reduce((max, item) => Math.max(max, item.score), 0);
      setHighscore(highestScore);
    };

    getHighscore();
  }, []);

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
    const minY = sceneDimensions.height * 0.9; // score at 0 at 10% or lower

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
      endTime: Date.now() + 3000,
    };
  };

  const makeBody = (svgPath, x, y) => {
    const bodyVariants = ["normal", "bouncy", "icy", "heavy", "sticky"];

    const bodyProperties = {
      normal: {
        restitution: 0.2,
        friction: 0.5,
        density: 1,
      },
      bouncy: {
        restitution: 0.8,
        friction: 2,
        density: 2,
      },
      icy: {
        restitution: 0.01,
        friction: 0.1,
        density: 1,
        opacity: 0.3,
      },
      heavy: {
        restitution: 0.0,
        friction: 0.7,
        density: 3,
      },
      sticky: {
        restitution: 0.0,
        friction: Infinity,
        density: 1,
        opacity: 0.6,
      },
    };

    const bodyColors = {
      normal: ["#FCFDFE", "#F9FBFD", "#F6F9FB", "#F1F6F9"],
      bouncy: [
        "rgb(201, 121, 201)",
        "rgb(233, 105, 233)",
        "rgb(172, 82, 172))",
        "rgb(172, 93, 172)",
      ],
      icy: [
        "rgb(0, 255, 255)",
        "rgb(30, 209, 209)",
        "rgb(70, 230, 230)",
        "rgb(60, 199, 199)",
      ],
      heavy: [
        "rgb(109, 109, 109)",
        "rgb(143, 143, 143)",
        "rgb(163, 163, 163)",
        "rgb(94, 94, 94)",
      ],
      sticky: [
        "rgb(81, 201, 101)",
        "rgb(61, 212, 86)",
        "rgb(74, 218, 98)",
        "rgb(55, 187, 77)",
      ],
    };

    const selectedVariant =
      bodyVariants[Math.floor(rng() * bodyVariants.length)];
    const properties = bodyProperties[selectedVariant];

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
        restitution: properties.restitution,
        friction: properties.friction,
        collisionFilter: {
          category: 0x0001, // Will be selectable by mouse
        },
      },
      true
    );

    Body.setDensity(svgBody, properties.density);

    if (svgBody.parts && svgBody.parts.length > 1) {
      // Skip index 0 as it's the parent body
      for (let i = 1; i < svgBody.parts.length; i++) {
        svgBody.parts[i].render.fillStyle =
          bodyColors[selectedVariant][
            Math.floor(rng() * bodyColors[selectedVariant].length)
          ];
        svgBody.parts[i].render.strokeStyle = bodyColors[selectedVariant][0];
        svgBody.parts[i].render.lineWidth = 2;
        svgBody.parts[i].render.opacity = properties.opacity || 1;
        svgBody.parts[i].inertia = Infinity;
      }
    } else {
      svgBody.render.fillStyle =
        bodyColors[selectedVariant][
          Math.floor(rng() * bodyColors[selectedVariant].length)
        ];
      svgBody.render.strokeStyle = bodyColors[selectedVariant][0];
      svgBody.render.lineWidth = 2;
      svgBody.render.opacity = properties.opacity || 1;
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
      positionIterations: 10,
      velocityIterations: 10,
      constraintIterations: 10,
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
      const wallOptions = {
        isStatic: true,
        render: { visible: false },
        collisionFilter: {
          group: -1, // Negative group means walls won't be selected by mouse
          category: 0x0002,
          mask: 0x0001,
        },
      };

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
        mask: 0x0001, // Only select bodies with category 0x0001
      },
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
          if (isValid) {
            setFinalScore(currentScore);
          }
          // Log results
          console.log(
            `Initial score: ${stabilityCheck.initialScore.toFixed(1)}`
          );
          console.log(
            `Max score difference: ${stabilityCheck.maxDifference.toFixed(
              1
            )}, Is valid: ${isValid}`
          );

          // Reset checking state
          stabilityCheck.isChecking = false;
        }
      }

      const selectedBody = mouseConstraint.body;
      if (selectedBody) {
        if (rotating.left) {
          Body.setAngularVelocity(selectedBody, -0.03);
        } else if (rotating.right) {
          Body.setAngularVelocity(selectedBody, 0.03);
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
          y > sceneHeight + paddingY ||
          y < 0 - paddingY ||
          x < 0 - paddingX ||
          x > sceneWidth + paddingX;

        for (let wall of walls) {
          const collision = Collision.collides(body, wall);
          if ((collision?.collided && collision.depth > 30) || outOfBounds) {
            if (
              body !== wall &&
              wall.isStatic &&
              mouseConstraint.body !== body
            ) {
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

  const handleScoreSubmission = async () => {
    await addScore(playerInfo);
  };

  const promptScore = () => {
    if (!isModalOpen) return null;
    console.log(highscore);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-charcoal-900 text-anti-flash-white-300 p-6 rounded-lg shadow-lg w-1/3">
          <h2 className="text-2xl font-bold mb-4">Submit Your Score</h2>
          <p>Your final score is: {finalScore?.toFixed(0)}</p>
          {finalScore > highscore && (
            <p className="text-viridian-300 font-bold mt-2">New High Score!</p>
          )}
          {finalScore < highscore && (
            <p className="text-anti-flash-white-300 font-bold mt-2">
              Today's High Score: {highscore}
            </p>
          )}
          <input
            type="string"
            value={playerInfo.name}
            onChange={(e) =>
              setPlayerInfo({
                ...playerInfo,
                score: Math.round(finalScore),
                name: e.target.value
                  .trim()
                  .replace(/[^A-z a-z]/g, "")
                  .substring(0, 10),
              })
            }
            placeholder="Enter your name"
            className="border border-anti-flash-white-500 text-anti-flash-white-500 bg-charcoal-700 rounded-md p-4 m-2 text-2xl"
          />
          <div className="flex justify-end">
            <button
              className={
                submit
                  ? "bg-satin-sheen-gold-700"
                  : "bg-viridian-700" +
                    " text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md mx-2"
              }
              onClick={async () => {
                console.log("Score submitted:", finalScore);
                await handleScoreSubmission();
                setIsModalOpen(false);
                router.push("/");
              }}
            >
              Submit
            </button>
            <button
              className="bg-satin-sheen-gold-700 text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-cool-grey-800 transition duration-300 shadow-md mx-2"
              onClick={() => {
                setIsModalOpen(false);
                setIsInstructionsOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInstructionsModal = () => {
    if (!isInstructionsOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-charcoal-900 text-anti-flash-white-300 p-6 rounded-lg shadow-lg w-1/3">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          <p className="mb-4">
            Stack the letters as high as possible without letting them fall!
            Different letters have different physical properties. Use the
            following controls:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>
              <strong>Q:</strong> Rotate left
            </li>
            <li>
              <strong>E:</strong> Rotate right
            </li>
            <li>
              <strong>Left Mouse:</strong> Drag and drop letters
            </li>
            <li>
              <strong>Right Mouse:</strong> Drop in place
            </li>
          </ul>
          <p className="mb-4">
            Once you're satisfied with your stack, click "Check Score" to see if
            it's stable. If it is, you can submit your score!
          </p>
          <div className="flex justify-end">
            <button
              className="bg-viridian-700 text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md mx-2"
              onClick={() => {
                setIsModalOpen(false);
                setIsInstructionsOpen(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {isCheckingStability && (
        <div
          className="fixed inset-0 bg-opacity-0 z-50 pointer-events-auto"
          style={{ cursor: "not-allowed" }}
        ></div>
      )}
      {sceneDimensions.height > 400 && (
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
            <div className="flex flex-row">
              <button
                className="bg-cool-grey-700 text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-cool-grey-800 transition duration-300 shadow-md mx-2"
                onClick={checkScore}
                disabled={isCheckingStability}
              >
                {isCheckingStability ? "Checking stability..." : "Check Score"}
              </button>
              {finalScore && (
                <button
                  className={`${
                    isCheckingStability
                      ? "bg-satin-sheen-gold-700"
                      : "bg-cool-grey-700"
                  } text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-cool-grey-800 transition duration-300 shadow-md mx-2`}
                  onClick={() => {
                    setIsInstructionsOpen(false);
                    setIsModalOpen(true);
                  }}
                  disabled={isCheckingStability}
                >
                  Submit Score!
                </button>
              )}
            </div>

            <div className="mt-2">
              <p className="text-anti-flash-white-300">
                Current Score: {score.toFixed(0)}
                {finalScore && " | Highest Score: " + finalScore.toFixed(0)}
              </p>

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
      )}
      {sceneDimensions.height <= 400 && (
        <div>
          <p>This screen may be too short to play optimally.</p>
        </div>
      )}
      {promptScore()}
      {renderInstructionsModal()}
      <div className="fixed top-0 right-0 text-anti-flash-white-300 p-4 text-center z-40">
        <button
          className="bg-cool-grey-700 text-anti-flash-white-300 px-4 py-2 rounded-md cursor-pointer hover:bg-cool-grey-800 transition duration-300 shadow-md mx-2"
          onClick={() => {
            setIsInstructionsOpen(true);
            setIsModalOpen(false);
          }}
        >
          Instructions
        </button>
      </div>
    </div>
  );
}
