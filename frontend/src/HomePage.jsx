/** @jsxRuntime classic */
/** @jsx jsx */
import {css, jsx} from "@emotion/react";
import logo from "./unicorn.png";
import "./App.css";
import React from "react";
import {Button} from "antd";
import {history} from "./routes";
import {withRouter} from "react-router-dom";

const buttonCss = css`
  color: pink;
  position: absolute;
  right: 30px;
  bottom: 30px;
`;

function HomePage() {
    const navigateToLoginPage = () => {
        history.push("/login");
    };

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <h1> Welcome to Unicorn! </h1>
                <p>we're so happy you're here🦄✨</p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                ></a>
            </header>
            <Button css={buttonCss} onClick={navigateToLoginPage}>
                enter
            </Button>
        </div>
    );
}

export default withRouter(HomePage);
