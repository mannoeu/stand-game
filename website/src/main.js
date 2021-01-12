import * as React from "react";
import { render } from "react-dom";
import { useSprings, animated, interpolate } from "react-spring";
import { useGesture } from "react-use-gesture";
import "./App.css";

const cards = Array.from({ length: 22 })
  .map((_, i) => ({
    url: `https://github.com/mannoeu/stand-game/raw/master/images/cards/${
      ++i < 10 ? `0${i}` : i
    }.jpg`,
    i,
  }))
  .reverse();

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = (i) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = () => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r, s) =>
  `perspective(1500px) rotateX(30deg) rotateY(${
    r / 10
  }deg) rotateZ(${r}deg) scale(${s})`;

function Deck() {
  const [gone] = React.useState(() => new Set()); // The set flags all the cards that are flicked out
  const [props, set] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(),
  })); // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
  const bind = useGesture(
    ({
      args: [index],
      down,
      delta: [xDelta],
      distance,
      direction: [xDir],
      velocity,
    }) => {
      const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
      const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
      if (!down && trigger) gone.add(index); // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
      set((i) => {
        if (index !== i) return; // We're only interested in changing spring-data for the current spring
        const isGone = gone.has(index);
        const x = isGone ? (200 + window.innerWidth) * dir : down ? xDelta : 0; // When a card is gone it flys out left or right, otherwise goes back to zero
        const rot = xDelta / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
        const scale = down ? 1.1 : 1; // Active cards lift up a bit
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });
      if (!down && gone.size === cards.length) {
        setTimeout(() => {
          gone.clear();

          set((i) => to(i));
        }, 600);
      }
    }
  );
  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)

  const sum = (n) => n.reduce((ac, n) => ac + n);
  const sumAsStr = (n) =>
    sum(
      n
        .toString()
        .split("")
        .map((e) => Number(e))
    );

  React.useEffect(() => {
    const response = window.prompt(
      "Digite sua data de nascimento (DD/MM/AAAA)"
    );

    if (/[0-3][1-9]\/(0|1)[0-9]\/(1|2)(9|0)[0-9][0-9]/g.test(response)) {
      const [...birth] = response.split("/");

      const s1 = sum(birth);

      const s2 = sumAsStr(s1);

      const card = s2 > 22 ? sumAsStr(s2) : s2;

      const i = cards.length - card;

      set((index) => {
        if (index === i) return; // We're only interested in changing spring-data for the current spring

        const dir = Math.random() < 0.5;

        const isGone = true;
        const down = false;
        const velocity = 50;

        const x = 200 + window.innerWidth;
        const rot = 0 / 100 + dir * 10 * velocity;
        const scale = down ? 1.1 : 1; // Active cards lift up a bit
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });
    } else {
      // Invalid date
      console.log("invalud");
    }
  }, []);

  return props.map(({ x, y, rot, scale }, i) => (
    <animated.div
      key={i}
      style={{
        transform: interpolate(
          [x, y],
          (x, y) => `translate3d(${x}px,${y}px,0)`
        ),
      }}
    >
      {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
      <animated.div
        {...bind(i)}
        style={{
          transform: interpolate([rot, scale], trans),
          backgroundImage: `url(${cards[i].url})`,
        }}
      />
    </animated.div>
  ));
}

render(<Deck />, document.getElementById("app"));
