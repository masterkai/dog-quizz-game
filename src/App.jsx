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
      <p className="text-center fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center">
        <button
          onClick={() => console.log(state)}
          className="text-white bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-3 rounded text-2xl font-bold"
        >
          Play
        </button>
      </p>
    </div>
  );
}

export default App;
