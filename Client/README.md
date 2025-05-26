# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

"scripts": {
"start": "react-scripts start",
"build": "react-scripts build",
"test": "react-scripts test",
"eject": "react-scripts eject"
},

nvm use system
$ npm uninstall -g a_module

import React from "react";
import ReactDOM from "react-dom/client";
import App from "../app/App";

const root = ReactDOM.createRoot(
document.getElementById("root") as HTMLElement
);
root.render(
<React.StrictMode>
<App />
</React.StrictMode>
);

// position: "fixed",
// top: 0,
// ...(entryDir === "LEFT" ? { left: 0 } : { right: 0 }),

// useEffect(() => {
// if (!feedback.message.timed) return;

// const intervalId = setInterval(() => {
// setFeedback((prevState) => {
// const newSeconds = prevState.progressBar.seconds - 1;
// const newWidth = prevState.progressBar.width - 40;

// if (newSeconds < 1) {
// clearInterval(intervalId);
// setFeedbackMessage({ timedMessage: null }, null, 0); // ✅ Clear message now
// console.log(feedback);
// // Delay resetting progress bar
// setTimeout(() => {
// setFeedback((prev) => progressBarState(5, 100, prev));
// }, 300);
// return prevState; // No immediate update
// }
// return progressBarState(newSeconds, newWidth, prevState);
// });
// }, 1000);
// console.log(feedback);

// return () => clearInterval(intervalId);
// }, [feedback.message.timed]);

const { feedback, setFeedback } = useAppContext();

const setFeedbackMessage = (
{
timedMessage,
fixedMessage,
}: { timedMessage?: string | null; fixedMessage?: string | null },
type: "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null = null,
delay = 0
) => {
if (fixedMessage !== undefined) {
setFeedback((prev) => ({
...prev,
message: { ...prev.message, fixed: fixedMessage },
type,
}));
}

    if (timedMessage !== undefined) {
      setTimeout(() => {
        setFeedback((prev) => ({
          ...prev,
          message: { ...prev.message, timed: timedMessage },
          type,
        }));
      }, delay);
    }

};

const progressBarState = (
seconds: number,
width: number,
prevState?: Feedback
): Feedback => {
const updatedState: Feedback = {
...(prevState ?? feedback),
progressBar: {
seconds,
width: width > 0 ? width : 0,
},
};
setFeedback(updatedState);
return updatedState;
};

return { setFeedbackMessage, progressBarState };
};
