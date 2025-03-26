'use client';

import { useEffect, useRef } from 'react';
import * as Matter from 'matter-js';

export default function MatterScene() {
  const sceneRef = useRef();

  useEffect(() => {
    if (!sceneRef.current) return;

    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1 }
    });

    // Our renderer. renders inside sceneRef.current.
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: sceneRef.current.clientHeight,
        wireframes: false,
        background: 'transparent'
      }
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
        Bodies.rectangle(width / 2, 0, width, wallThickness, wallOptions)
      ];
    };

    // method that returns an array of bodies
    const createBodies = () => {
      const { width, height } = render.options;
      return [
        Bodies.rectangle(width * 0.3, height * 0.3, 80, 80),
        Bodies.rectangle(width * 0.7, height * 0.2, 80, 80),
        Bodies.circle(width * 0.5, height * 0.1, 40)
      ];
    };

    // add walls and bodies to world.
    Composite.add(engine.world, [
      ...createWalls(),
      ...createBodies()
    ]);

    // create a mouse and mouse constraint.
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    // method to prevent an event. use when wheel or domscroll occurs.
    // passive : false indicates that the method may call event.preventDefault()
    const preventScroll = (event) => event.preventDefault();
    render.canvas.addEventListener('wheel', preventScroll, { passive: false });
    render.canvas.addEventListener('DOMMouseScroll', preventScroll, { passive: false });

    const rotateBody = (event) => {
      // keys e and q, respectively.
      if (event.keyCode == 101 || event.keyCode == 113) {
        let selectedBody = mouseConstraint.body;
        if (selectedBody) {
          // turn left if we press q and right if we press e.
          selectedBody.angle += event.keyCode == 101 ? 1 * Math.PI / 360 : -1 * Math.PI / 360;
        }
      }
    }
    window.addEventListener('keypress', rotateBody);

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

    window.addEventListener('resize', handleResize);

    // cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      render.canvas.removeEventListener('wheel', preventScroll);
      render.canvas.removeEventListener('DOMMouseScroll', preventScroll);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return (
    <div 
      ref={sceneRef} 
      className="w-full h-full absolute inset-0 overflow-hidden"
    />
  );
}