import Vue from "vue";
import Autocomplete from "buefy";
import App from "./App.vue";

import "bulma/css/bulma.min.css";
import "buefy/dist/buefy.css";
import "metrics-graphics/dist/metricsgraphics.css";

Vue.use(Autocomplete);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
