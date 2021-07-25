import React from "react";
import {
  Router,
  Switch,
  Route,
  Redirect,
  BrowserRouter,
} from "react-router-dom";
import TrendingModels from "./components/TrendingModels";
import axios from "axios";

import { createBrowserHistory } from "history";
import ModelCard from "./components/modelCard";
import ModelSandbox from "./components/modelSandbox";
import Viztein from "viztein";

export const history = createBrowserHistory();
let modelPages = [];
const serv = "https://api.getmoonbear.com:443";

function Routes() {
  axios
    .get(`${serv}/api/get_model_data`)
    .then((res) => {
      modelPages = res.data;
    })
    .catch((err) => {});
  const DynamicRoutes = () => {
    return modelPages.map((item, index) => {
      return (
        <Route
          exact
          key={index}
          path="/AlphaFoldLite"
          component={() => (
            <ModelSandbox
              model="aaaaaaaaa"
              info="aaaaa"
              sandbox="protein_vis"
            />
          )}
        />
      );
    });
  };
  return (
    <BrowserRouter history={history}>
      <Switch>
        {/*<Route exact path="/login" component={LoginPage}/>*/}
        <Route exact path="/" component={TrendingModels} />
        <Route
          exact
          path="/AlphaFoldLite"
          component={() => (
            <ModelSandbox
              model="AlphaFold Lite"
              info={null}
              sandbox="protein_vis"
            />
          )}
        />

        {/*<Route exact path="/pathology" component={PathologyPage}/>*/}
        {/*<Route exact path="/proteomics" component={ProteomicsPage}/>*/}
        {/*<Route exact path="/genomics" component={GenomicsPage}/>*/}
        {/*<Route exact path="/models" component={MLModelsPage}/>*/}
        {/*<Route exact path="/results" component={ResultsPage}/>*/}
        {/*<Route exact path="/protein_results" component={ProteinResultsPage}/>*/}
        {/*<Route exact path="/gene_results" component={GeneResultsPage}/>*/}
        <Redirect from="*" to="/" />

        <Routes />
      </Switch>
    </BrowserRouter>
  );
}

export default Routes;
