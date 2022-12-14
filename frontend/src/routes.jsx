import React, { Suspense, lazy } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import axios from "axios";

import { createBrowserHistory } from "history";
import Header from "./page_components/Header";
import HomePage from "./pages/HomePage";

const SandboxModel = lazy(() => import("./page_components/SandboxModel"));
const TrendingModels = lazy(() => import("./pages/TrendingModels"));

export const history = createBrowserHistory();
let modelPages = [];

function Routes() {
  // const DynamicRoutes = () => {
  //   return modelPages.map((item, index) => {
  //     return (
  //       <Route
  //         exact
  //         key={index}
  //         path="/AlphaFoldLite"
  //         component={() => (
  //           <SandboxModel
  //             model="aaaaaaaaa"
  //             info="aaaaa"
  //             sandbox="protein_vis"
  //           />
  //         )}
  //       />
  //     );
  //   });
  // };
  return (
    <BrowserRouter history={history}>
      <Suspense fallback={<Header />}>
        <Switch>
          {/*<Route exact path="/ModelHub" component={() => <TrendingModels />} />*/}
          <Route
            exact
            path="/AlphaFold2Lite"
            component={() => (
              <SandboxModel
                model="AlphaFold2 Lite"
                info={null}
                sandbox="protein_vis"
                api="alphafold2_lite"
                model_info="alphafold_paper.pdf"
              />
            )}
          />

            <Route
                exact
                path="/"
                component={() => (
                    <TrendingModels/>
                )}
            />

          <Route
            exact
            path="/AlphaFold2"
            component={() => (
              <SandboxModel
                model="AlphaFold2"
                info={null}
                sandbox="protein_vis"
                api="alphafold2"
                model_info="alphafold_paper.pdf"
              />
            )}
          />
          <Redirect from="*" to="/" />
          <Routes />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}

export default Routes;
