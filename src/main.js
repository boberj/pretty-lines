import Vue from "vue";
import App from "./App.vue";
import VueInstant from "vue-instant/dist/vue-instant.common";

import "bulma/css/bulma.min.css";
import "vue-instant/dist/vue-instant.css";

Vue.use(VueInstant);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
