import { useEffect } from "react";
import axios from "axios";
import { useImmerReducer } from "use-immer";

function onlyUniqueBreeds(pics) {
  const uniqueBreeds = [];
  const uniquePics = pics.filter((pic) => {
    const breed = pic.split("/")[4];
    if (!uniqueBreeds.includes(breed) && !pic.includes(" ")) {
      uniqueBreeds.push(breed);
      return true;
    }
  });
  return uniquePics.slice(0, Math.floor(uniquePics.length / 4) * 4);
}

function ourReducer(draft, action) {
  if (draft.points > draft.highScore) draft.highScore = draft.points;

  switch (action.type) {
    case "receiveHighScore":
      draft.highScore = action.value;
      if (!action.value) draft.highScore = 0;
      return;
    case "decreaseTime":
      if (draft.timeRemaining <= 0) {
        draft.playing = false;
      } else {
        draft.timeRemaining--;
      }
      return;
    case "guessAttempt":
      if (!draft.playing) return;
      if (action.value === draft.currentQuestion.answer) {
        draft.points++;
        draft.currentQuestion = generateQuestion();
      } else {
        draft.strikes++;
        if (draft.strikes >= 3) {
          draft.playing = false;
        }
      }
      return;
    case "startPlaying":
      draft.timeRemaining = 30;
      draft.points = 0;
      draft.strikes = 0;
      draft.playing = true;
      draft.currentQuestion = generateQuestion();
      return;
    case "addToCollection":
      draft.bigCollection = draft.bigCollection.concat(action.value);
      return;
  }

  function generateQuestion() {
    if (draft.bigCollection.length <= 12) {
      draft.fetchCount++;
    }

    if (draft.currentQuestion) {
      draft.bigCollection = draft.bigCollection.slice(
        4,
        draft.bigCollection.length
      );
    }

    const tempRandom = Math.floor(Math.random() * 4);
    const justFour = draft.bigCollection.slice(0, 4);
    return {
      breed: justFour[tempRandom].split("/")[4],
      photos: justFour,
      answer: tempRandom,
    };
  }
}

const initialState = {
  points: 0,
  strikes: 0,
  timeRemaining: 0,
  highScore: 0,
  bigCollection: [],
  currentQuestion: null,
  playing: false,
  fetchCount: 0,
};

function HeartIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      fill="currentColor"
      className={props.className}
      viewBox="0 0 16 16"
    >
      <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z" />
    </svg>
  );
}

function App() {
  const [state, dispatch] = useImmerReducer(ourReducer, initialState);
  useEffect(() => {
    const reqController = new AbortController();
    (async () => {
      try {
        const response = await axios.get(
          "https://dog.ceo/api/breeds/image/random/50",
          { signal: reqController.signal }
        );
        const data = await response.data;
        const pics = await data.message;
        // console.log(pics);
        const uniquePics = onlyUniqueBreeds(pics);
        dispatch({ type: "addToCollection", value: uniquePics });
      } catch (e) {
        console.log(`our request is ${e.message}`);
      }
    })();
    return () => {
      reqController.abort();
    };
  }, []);
  return (
    <div>
      {state.currentQuestion && (
        <>
          <p className="text-center">
            <span className="text-zinc-400 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="currentColor"
                className={
                  "inline-block " + (state.playing ? "animate-spin" : "")
                }
                viewBox="0 0 16 16"
              >
                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
              </svg>
              <span className="font-mono text-4xl relative top-2 ml-3">
                0:
                {state.timeRemaining < 10
                  ? "0" + state.timeRemaining
                  : state.timeRemaining}
              </span>
            </span>

            {[...Array(3 - state.strikes)].map((item, index) => {
              return (
                <HeartIcon key={index} className="inline text-pink-600 mx-1" />
              );
            })}
            {[...Array(state.strikes)].map((item, index) => {
              return (
                <HeartIcon key={index} className="inline text-pink-100 mx-1" />
              );
            })}
          </p>
          <h1 className="text-center font-bold pt-3 pb-10 break-all text-4xl md:text-7xl">
            {state.currentQuestion.breed}
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-5">
            {state.currentQuestion.photos.map((photo, index) => {
              return (
                <div
                  onClick={() =>
                    dispatch({ type: "guessAttempt", value: index })
                  }
                  key={index}
                  className="rounded-lg h-40 lg:h-80 bg-cover bg-center cursor-pointer"
                  style={{ backgroundImage: `url(${photo})` }}
                ></div>
              );
            })}
          </div>
        </>
      )}
      {state.playing === false &&
        Boolean(state.bigCollection.length) &&
        !state.currentQuestion && (
          <p className="text-center fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <button
              onClick={() => dispatch({ type: "startPlaying" })}
              className="text-white bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-3 rounded text-2xl font-bold"
            >
              Play
            </button>
          </p>
        )}
    </div>
  );
}

export default App;
