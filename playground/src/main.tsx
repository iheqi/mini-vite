// import React from "react";
// import ReactDOM from "react-dom";
// import App from "./App";
// import "./index.css";

// ReactDOM.render(<App />, document.getElementById("root"));


import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const App = () => <div>hello world!!!</div>;
ReactDOM.render(<App />, document.getElementById("root"));

// @ts-ignore
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/import.meta
import.meta.hot.accept((...rest) => {
  console.log('fuck', rest);
  ReactDOM.render(<App />, document.getElementById("root"));
});